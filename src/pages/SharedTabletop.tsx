import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { StageZoomFocus } from '@/hooks/useStageZoom';
import { DiceBar, DiceAnimation, Roll } from '@/components/DiceBar';
import { invokeResilient } from '@/lib/network';

interface Condition { id: string; name: string; rounds: number }
interface Token { id: string; name: string; image: string; x: number; y: number; size: number; rotation?: number; conditions?: Condition[] }
interface FogRect { id: string; x: number; y: number; w: number; h: number }
interface SharedBoard {
  id: string; name: string; map_url: string; tokens: Token[]; grid: boolean;
  fog: FogRect[]; zoom: number; camera?: StageZoomFocus; last_roll: Roll | null; updated_at: string;
  turn_order?: string[]; active_turn?: number; round?: number; vision_mode?: 'all' | 'token';
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
  const [connection, setConnection] = useState<'online' | 'retrying' | 'offline'>('retrying');
  const observer = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'observer';
  const playerTokenId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
  const zoom = board?.zoom ?? 1;
  const pending = useRef<{ tokens?: Token[]; last_roll?: Roll } | null>(null);

  const centerOnCamera = (focus?: StageZoomFocus) => {
    const stage = stageRef.current;
    const content = mapRef.current;
    if (!stage || !content || !focus) return;
    // Use the rendered rect instead of assuming that the map starts at (0, 0).
    // This matters on narrow mobile viewports, where `mx-auto` and overflow can
    // add an offset and otherwise move the master's focal point for players.
    const stageRect = stage.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const targetLeft = contentRect.left - stageRect.left + focus.x * contentRect.width - stage.clientWidth / 2;
    const targetTop = contentRect.top - stageRect.top + focus.y * contentRect.height - stage.clientHeight / 2;
    const maxLeft = Math.max(0, stage.scrollWidth - stage.clientWidth);
    const maxTop = Math.max(0, stage.scrollHeight - stage.clientHeight);
    stage.scrollLeft = Math.min(maxLeft, Math.max(0, stage.scrollLeft + targetLeft));
    stage.scrollTop = Math.min(maxTop, Math.max(0, stage.scrollTop + targetTop));
  };

  const cameraX = board?.camera?.x;
  const cameraY = board?.camera?.y;
  const scheduleCameraFocus = (focus?: StageZoomFocus) => {
    if (!focus) return () => {};
    let cancelled = false;
    let frame = 0;
    let rafId = 0;
    const apply = () => {
      if (cancelled) return;
      centerOnCamera(focus);
      frame += 1;
      if (frame < 4) rafId = requestAnimationFrame(apply);
    };
    rafId = requestAnimationFrame(apply);
    const timer = window.setTimeout(() => centerOnCamera(focus), 150);
    return () => { cancelled = true; window.cancelAnimationFrame(rafId); window.clearTimeout(timer); };
  };
  useEffect(() => {
    if (cameraX === undefined || cameraY === undefined) return;
    return scheduleCameraFocus({ x: cameraX, y: cameraY });
  }, [board?.updated_at, cameraX, cameraY]);

  const flushPending = async () => {
    if (!shareId || !pending.current) return;
    const payload = { ...pending.current };
    setConnection('retrying');
    const { error } = await invokeResilient('shared-tabletop', {
      action: 'shared-update', shareId, tokenId: playerTokenId, ...payload,
    }, { attempts: 4 });
    if (error) {
      setConnection('offline');
      return;
    }
    if (pending.current?.tokens === payload.tokens) delete pending.current.tokens;
    if (pending.current?.last_roll === payload.last_roll) delete pending.current.last_roll;
    if (pending.current && !pending.current.tokens && !pending.current.last_roll) pending.current = null;
    setConnection('online');
  };

  useEffect(() => {
    let stop = false;
    const load = async () => {
      if (loadingRef.current || document.hidden) return;
      loadingRef.current = true;
      const { data, error } = await invokeResilient<{ unchanged?: boolean; board?: SharedBoard }>('shared-tabletop', {
        shareId, since: lastUpdatedAt.current || undefined,
      });
      try {
        if (stop) return;
        if (error) { setConnection('offline'); return; }
        setConnection('online');
        if (data?.unchanged) return;
        if (data?.board) {
          const b = data.board as SharedBoard;
          lastUpdatedAt.current = b.updated_at ?? lastUpdatedAt.current;
          if (b.last_roll && b.last_roll.at > lastRollAt.current) {
            lastRollAt.current = b.last_roll.at;
            setAnimRoll(b.last_roll);
          }
          if (!dirty.current) setBoard(b);
        } else if (!board) setMissing(true);
      } finally {
        loadingRef.current = false;
      }
    };
    load();
    const id = setInterval(() => { void load(); void flushPending(); }, 2000);
    const onOnline = () => { setConnection('retrying'); void load(); void flushPending(); };
    window.addEventListener('online', onOnline);
    return () => { stop = true; clearInterval(id); window.removeEventListener('online', onOnline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  const pushTokens = (tokens: Token[]) => {
    if (!shareId) return;
    dirty.current = true;
    setBoard(prev => (prev ? { ...prev, tokens } : prev));
    pending.current = { ...pending.current, tokens };
    setConnection('retrying');
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => { void flushPending().finally(() => {
      setTimeout(() => { if (!drag.current) dirty.current = false; }, 600);
    }); }, 180);
  };

  const rollDice = (roll: Roll) => {
    const r = { ...roll, by: 'Jogador' };
    lastRollAt.current = r.at;
    setAnimRoll(r);
    pending.current = { ...pending.current, last_roll: r };
    void flushPending();
  };

  const pct = (e: React.PointerEvent) => {
    const r = mapRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const onTokenDown = (e: React.PointerEvent, t: Token) => {
    if (observer || !playerTokenId || t.id !== playerTokenId) return;
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
        <span className="ml-auto rounded-md border border-border/60 px-2 py-1 text-[10px] tabular-nums">Zoom do mestre {Math.round(zoom * 100)}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {observer ? 'Observador' : connection === 'online' ? 'Salvo e ao vivo' : connection === 'retrying' ? 'Reconectando…' : 'Offline · tentando salvar'}
        </span>
        <span className={`w-2 h-2 rounded-full ${connection === 'online' ? 'bg-green-500 animate-pulse' : connection === 'retrying' ? 'bg-amber-400 animate-pulse' : 'bg-destructive'}`} />
      </header>
      <div className="px-4 py-1.5 border-b border-border/30 text-xs text-muted-foreground">
        Rodada {board.round ?? 1} · turno {board.turn_order?.length ? (board.tokens.find(t => t.id === board.turn_order?.[board.active_turn ?? 0])?.name ?? '—') : 'não definido'}
      </div>
      <div ref={stageRef} className="relative flex-1 overflow-hidden pb-20 overscroll-none touch-none">
        <div
          ref={mapRef}
          className="relative mx-auto select-none touch-none"
          style={{ width: `${zoom * 100}%` }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {board.map_url ? (
            <img src={board.map_url} alt={board.name} draggable={false} onLoad={() => scheduleCameraFocus(board.camera)} className="w-full block pointer-events-none" />
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
                style={{ transform: `rotate(${t.rotation ?? 0}deg)` }}
                className="w-full object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />
              <p className="text-center text-[10px] sm:text-xs font-bold text-foreground bg-background/70 rounded px-1 mt-0.5 truncate">{t.name}</p>
              {(t.conditions ?? []).length > 0 && <div className="flex justify-center gap-1 flex-wrap">{(t.conditions ?? []).map(c => <span key={c.id} className="rounded-full bg-amber-500/80 px-1 text-[8px] text-black">{c.name} · {c.rounds}r</span>)}</div>}
            </div>
          ))}
        </div>
      </div>
      {/* Barra de dados fixa embaixo */}
      {!observer && <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40"><DiceBar onRoll={rollDice} /></div>}
      <DiceAnimation roll={animRoll} />
    </div>
  );
};

export default SharedTabletop;
