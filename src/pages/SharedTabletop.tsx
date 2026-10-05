import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { DiceBar } from '@/components/DiceBar';

interface Token { id: string; name: string; image: string; x: number; y: number; size: number }
interface FogRect { id: string; x: number; y: number; w: number; h: number }
interface BoardView { zoom?: number; x?: number; y?: number }
interface SharedBoard {
  id: string; name: string; map_url: string; tokens: Token[]; grid: boolean;
  fog: FogRect[]; view: BoardView; updated_at: string;
}

/** Mapa compartilhado pelo mestre: tempo real, jogadores movem os próprios bonecos. */
const SharedTabletop = () => {
  const { shareId } = useParams();
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [missing, setMissing] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const sendT = useRef<ReturnType<typeof setTimeout>>();

  // Carga inicial + tempo real
  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    supabase.functions.invoke('shared-tabletop', { body: { shareId } })
      .then(({ data }) => {
        if (stop) return;
        if (data?.board) setBoard(data.board);
        else setMissing(true);
      })
      .catch(() => setMissing(true));

    const channel = supabase
      .channel(`shared-tabletop-${shareId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tabletops', filter: `share_id=eq.${shareId}` },
        (payload) => {
          const row = payload.new as any;
          setBoard(prev => {
            // não pisa em cima do boneco que o jogador está arrastando
            if (drag.current && prev) {
              row.tokens = (row.tokens ?? []).map((t: Token) =>
                t.id === drag.current!.id ? prev.tokens.find(p => p.id === t.id) ?? t : t);
            }
            return row as SharedBoard;
          });
        })
      .subscribe();
    return () => { stop = true; supabase.removeChannel(channel); };
  }, [shareId]);

  // Espelha o zoom/posição do mestre
  useEffect(() => {
    const st = stageRef.current;
    if (!st || !board?.view) return;
    const { zoom = 1, x = 0, y = 0 } = board.view;
    if (mapRef.current) mapRef.current.style.width = `${zoom * 100}%`;
    st.scrollLeft = x;
    st.scrollTop = y;
  }, [board?.view]);

  const pct = (e: React.PointerEvent) => {
    const r = mapRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const sendMove = (id: string, x: number, y: number) => {
    clearTimeout(sendT.current);
    sendT.current = setTimeout(() => {
      supabase.functions.invoke('shared-tabletop', { body: { action: 'move-token', shareId, tokenId: id, x, y } }).catch(() => {});
    }, 120);
  };

  const onTokenDown = (e: React.PointerEvent, t: Token) => {
    e.stopPropagation();
    const p = pct(e);
    drag.current = { id: t.id, dx: p.x - t.x, dy: p.y - t.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !mapRef.current) return;
    const p = pct(e);
    const x = Math.max(0, Math.min(100, p.x - drag.current.dx));
    const y = Math.max(0, Math.min(100, p.y - drag.current.dy));
    const id = drag.current.id;
    setBoard(prev => prev && ({
      ...prev,
      tokens: prev.tokens.map(t => (t.id === id ? { ...t, x, y } : t)),
    }));
    sendMove(id, x, y);
  };

  const onUp = () => { drag.current = null; };

  if (missing && !board) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 subtle-pattern">
        <p className="text-muted-foreground text-sm">Mapa não encontrado. Peça o link de novo ao mestre.</p>
      </div>
    );
  }
  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Abrindo o mapa...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
        <MapIcon className="w-4 h-4 text-primary" />
        <h1 className="font-display font-bold truncate">{board.name}</h1>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Ao vivo</span>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </header>
      <div
        ref={stageRef}
        className="flex-1 overflow-auto touch-none"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div ref={mapRef} className="relative mx-auto select-none" style={{ width: '100%' }}>
          {board.map_url ? (
            <img src={board.map_url} alt={board.name} draggable={false} className="w-full block pointer-events-none" />
          ) : (
            <div className="aspect-video flex items-center justify-center text-muted-foreground subtle-pattern">
              <p className="text-sm">O mestre ainda não carregou o mapa</p>
            </div>
          )}
          {board.grid && (
            <div className="absolute inset-0 pointer-events-none opacity-40"
              style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)/0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.4) 1px, transparent 1px)', backgroundSize: '5% 5%' }} />
          )}
          {(board.fog ?? []).map(f => (
            <div key={f.id} className="absolute bg-black/95 pointer-events-none"
              style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }} />
          ))}
          {board.tokens.map(t => (
            <div key={t.id}
              onPointerDown={e => onTokenDown(e, t)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.size}%` }}>
              <img src={t.image} alt={t.name} draggable={false}
                className="w-full object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />
              <p className="text-center text-[10px] sm:text-xs font-bold text-foreground bg-background/70 rounded px-1 mt-0.5 truncate">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
      <footer className="border-t border-border/40 p-2 space-y-1">
        <DiceBar />
        <p className="text-[10px] text-muted-foreground">Arraste seu boneco para mover · a névoa preta só o mestre revela.</p>
      </footer>
    </div>
  );
};

export default SharedTabletop;
