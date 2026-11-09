import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { DiceBar, DiceAnimation, Roll } from '@/components/DiceBar';

interface Token { id: string; name: string; image: string; x: number; y: number; size: number }
interface FogRect { id: string; x: number; y: number; w: number; h: number }
interface SharedBoard {
  id: string; name: string; map_url: string; tokens: Token[]; grid: boolean;
  fog: FogRect[]; zoom: number; camera_x?: number; camera_y?: number; last_roll: Roll | null; updated_at: string;
}

/** Mapa compartilhado pelo mestre: jogadores veem em tempo real, movem os bonecos e rolam dados.
 *  Névoa, mapa, grade e zoom só o mestre controla. */
const SharedTabletop = () => {
  const { shareId } = useParams();
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [missing, setMissing] = useState(false);
  const [animRoll, setAnimRoll] = useState<Roll | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const dirty = useRef(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const saveT = useRef<ReturnType<typeof setTimeout>>();
  const lastRollAt = useRef(0);
  const lastUpdatedAt = useRef('');
  const loadingRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(0);
  const zoom = board?.zoom ?? 1;

  useEffect(() => {
    let stop = false;
    const load = async () => {
      if (loadingRef.current || document.hidden) return;
      loadingRef.current = true;
      const { data } = await supabase.functions.invoke('shared-tabletop', {
        body: { shareId, since: lastUpdatedAt.current || undefined },
      }).catch(() => ({ data: null }));
      try {
        if (stop) return;
        if (data?.unchanged) return;
        if (data?.board) {
          const b = data.board as SharedBoard;
          lastUpdatedAt.current = b.updated_at ?? lastUpdatedAt.current;
          const viewport = b.last_roll?.viewport;
          const nextBoard = viewport
            ? { ...b, zoom: viewport.zoom, camera_x: viewport.camera_x, camera_y: viewport.camera_y }
            : { ...b, camera_x: b.camera_x ?? 50, camera_y: b.camera_y ?? 50 };
          if (b.last_roll && !b.last_roll.viewport?.viewportOnly && b.last_roll.at > lastRollAt.current) {
            lastRollAt.current = b.last_roll.at;
            setAnimRoll(b.last_roll);
          }
          if (!dirty.current) setBoard(nextBoard);
        } else if (!board) setMissing(true);
      } finally {
        loadingRef.current = false;
      }
    };
    load();
    const id = setInterval(load, 650);
    return () => { stop = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  useLayoutEffect(() => {
    if (!board) return;
    const frame = requestAnimationFrame(() => {
      const stage = stageRef.current;
      const map = mapRef.current;
      if (!stage || !map || !map.offsetWidth || !map.offsetHeight) return;
      const cx = Math.max(0, Math.min(100, board.camera_x ?? 50)) / 100;
      const cy = Math.max(0, Math.min(100, board.camera_y ?? 50)) / 100;
      stage.scrollLeft = Math.max(0, map.offsetLeft + cx * map.offsetWidth - stage.clientWidth / 2);
      stage.scrollTop = Math.max(0, map.offsetTop + cy * map.offsetHeight - stage.clientHeight / 2);
    });
    return () => cancelAnimationFrame(frame);
    // Não incluir o objeto board inteiro: atualizações de tokens não devem recentralizar a câmera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id, board?.zoom, board?.camera_x, board?.camera_y, mapReady]);

  const pushTokens = (tokens: Token[]) => {
    if (!shareId) return;
    dirty.current = true;
    setBoard(prev => (prev ? { ...prev, tokens } : prev));
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      supabase.functions.invoke('shared-tabletop', { body: { action: 'shared-update', shareId, tokens } })
        .catch(() => {}).finally(() => { setTimeout(() => { if (!drag.current) dirty.current = false; }, 600); });
    }, 120);
  };

  const rollDice = (roll: Roll) => {
    const r = { ...roll, by: 'Jogador' };
    lastRollAt.current = r.at;
    setAnimRoll(r);
    supabase.functions.invoke('shared-tabletop', { body: { action: 'shared-update', shareId, last_roll: r } }).catch(() => {});
  };

  const pct = (e: React.PointerEvent) => {
    const r = mapRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const onTokenDown = (e: React.PointerEvent, t: Token) => {
    e.stopPropagation();
    const p = pct(e);
    drag.current = { id: t.id, dx: p.x - t.x, dy: p.y - t.y };
    setDragId(t.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !board || !mapRef.current) return;
    const p = pct(e);
    const x = Math.max(0, Math.min(100, p.x - drag.current.dx));
    const y = Math.max(0, Math.min(100, p.y - drag.current.dy));
    pushTokens(board.tokens.map(t => (t.id === drag.current!.id ? { ...t, x, y } : t)));
  };

  const onUp = () => { drag.current = null; setDragId(null); };

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
        <div className="ml-auto flex items-center gap-1">
          <span className="h-8 px-2 inline-flex items-center rounded-md border border-border/60 text-[10px] tabular-nums" title="Zoom controlado pelo mestre">Mestre · {Math.round(zoom * 100)}%</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Ao vivo</span>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </header>
      <div ref={stageRef} className="relative flex-1 overflow-auto pb-20 overscroll-contain">
        <div
          ref={mapRef}
          className="relative mx-auto select-none touch-pan-x touch-pan-y"
          style={{ width: `${zoom * 100}%`, transition: 'width 300ms ease-out' }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {board.map_url ? (
                <img src={board.map_url} alt={board.name} draggable={false} onLoad={() => setMapReady(v => v + 1)} className="w-full block pointer-events-none" />
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
            <div key={f.id} className="absolute z-20 bg-black/95 pointer-events-none"
              style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }} />
          ))}
          {board.tokens.map(t => (
            <div key={t.id}
              onPointerDown={e => onTokenDown(e, t)}
              className={`absolute touch-none -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing ${dragId === t.id ? '' : 'transition-[left,top] duration-300 ease-out'}`}
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.size}%` }}>
              <img src={t.image} alt={t.name} draggable={false}
                className="w-full object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />
              <p className="text-center text-[10px] sm:text-xs font-bold text-foreground bg-background/70 rounded px-1 mt-0.5 truncate">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Barra de dados fixa embaixo */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
        <DiceBar onRoll={rollDice} />
      </div>
      <DiceAnimation roll={animRoll} />
    </div>
  );
};

export default SharedTabletop;
