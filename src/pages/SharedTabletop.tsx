import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Map as MapIcon, Loader2 } from 'lucide-react';

interface Token { id: string; name: string; image: string; x: number; y: number; size: number }
interface FogRect { id: string; x: number; y: number; w: number; h: number }
interface SharedBoard {
  id: string; name: string; map_url: string; tokens: Token[]; grid: boolean;
  fog: FogRect[]; updated_at: string;
}

/** Mapa compartilhado pelo mestre: os jogadores veem em tempo real (só olhar). */
const SharedTabletop = () => {
  const { shareId } = useParams();
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const { data } = await supabase.functions.invoke('shared-tabletop', { body: { shareId } }).catch(() => ({ data: null }));
      if (stop) return;
      if (data?.board) setBoard(data.board);
      else if (!board) setMissing(true);
    };
    load();
    const id = setInterval(load, 3000);
    return () => { stop = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

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
      <div className="flex-1 overflow-auto">
        <div className="relative mx-auto select-none" style={{ width: '100%' }}>
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
            <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.size}%` }}>
              <img src={t.image} alt={t.name} draggable={false}
                className="w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />
              <p className="text-center text-[10px] sm:text-xs font-bold text-foreground bg-background/70 rounded px-1 mt-0.5 truncate">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SharedTabletop;
