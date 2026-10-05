import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Map as MapIcon, ImagePlus, UserPlus, Maximize2, Minimize2,
  Grid3x3, Loader2, ZoomIn, ZoomOut, Users, Hand, MousePointer2, Square, Share2, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { listRows, createRow, updateRow, deleteRow } from '@/lib/userData';
import { listSheets, Sheet } from '@/lib/sheets';
import { DiceBar } from '@/components/DiceBar';

interface Token {
  id: string;
  name: string;
  image: string;
  x: number; // % do mapa
  y: number;
  size: number; // % da largura do mapa
}
interface FogRect { id: string; x: number; y: number; w: number; h: number }
interface BoardView { zoom?: number; x?: number; y?: number }
interface Board {
  id: string;
  name: string;
  map_url: string;
  tokens: Token[];
  grid: boolean;
  fog: FogRect[];
  view?: BoardView;
  share_id?: string;
  updated_at?: string;
}

type Tool = 'move' | 'pan' | 'fog';

const uid = () => Math.random().toString(36).slice(2, 10);

const shrink = (file: File | string, max: number, keepPng: boolean): Promise<string> =>
  new Promise((resolve, reject) => {
    const load = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        try { resolve(c.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.85)); } catch { resolve(src); }
      };
      img.src = src;
    };
    if (typeof file === 'string') return load(file);
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => load(r.result as string);
    r.readAsDataURL(file);
  });

const Tabletop = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selToken, setSelToken] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [showCast, setShowCast] = useState(false);
  const [tool, setTool] = useState<Tool>('move');
  const [draftFog, setDraftFog] = useState<FogRect | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const pan = useRef<{ sx: number; sy: number; sl: number; st: number } | null>(null);
  const fogStart = useRef<{ x: number; y: number } | null>(null);
  const saveT = useRef<ReturnType<typeof setTimeout>>();
  const viewT = useRef<ReturnType<typeof setTimeout>>();
  const lastSave = useRef(0);

  useEffect(() => {
    listRows<Board>('tabletops')
      .then(list => { setBoards(list.map(b => ({ ...b, fog: b.fog ?? [] }))); setActiveId(list[0]?.id ?? null); })
      .catch(() => toast.error('Não consegui carregar os mapas.'))
      .finally(() => setLoading(false));
    listSheets().then(setSheets).catch(() => {});
    const h = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // Tempo real: quando um jogador move um boneco pelo link, aparece aqui
  useEffect(() => {
    const channel = supabase
      .channel('tabletops-master')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tabletops' }, (payload) => {
        const row = payload.new as Board;
        if (row.updated_at && lastSave.current && new Date(row.updated_at).getTime() <= lastSave.current) return;
        setBoards(prev => prev.map(b => (b.id === row.id ? { ...b, ...row, fog: row.fog ?? [] } : b)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'm') setTool('move');
      else if (k === 'h') setTool('pan');
      else if (k === 'n') setTool('fog');
      else if (k === 'g') board && patch({ grid: !board.grid }, true);
      else if (k === '+' || k === '=') setZoom(z => Math.min(3, z + 0.25));
      else if (k === '-') setZoom(z => Math.max(0.5, z - 0.25));
      else if (k === 'f') toggleFull();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const board = boards.find(b => b.id === activeId) ?? null;

  const patch = (p: Partial<Board>, now = false) => {
    if (!board) return;
    const id = board.id;
    setBoards(prev => prev.map(b => (b.id === id ? { ...b, ...p } : b)));
    clearTimeout(saveT.current);
    const run = () => { lastSave.current = Date.now(); updateRow('tabletops', id, p as any).catch(() => toast.error('Não consegui salvar.')); };
    if (now) run(); else saveT.current = setTimeout(run, 500);
  };

  /** Salva o zoom/posição do mestre para os jogadores acompanharem */
  const saveView = (z: number) => {
    if (!board || !stageRef.current) return;
    const view = { zoom: z, x: Math.round(stageRef.current.scrollLeft), y: Math.round(stageRef.current.scrollTop) };
    setBoards(prev => prev.map(b => (b.id === board.id ? { ...b, view } : b)));
    clearTimeout(viewT.current);
    viewT.current = setTimeout(() => { lastSave.current = Date.now(); updateRow('tabletops', board.id, { view } as any).catch(() => {}); }, 400);
  };

  const create = async () => {
    let data: Board;
    try { data = await createRow<Board>('tabletops', { name: `Mapa ${boards.length + 1}` }); }
    catch { return toast.error('Não consegui criar o mapa.'); }
    setBoards(prev => [...prev, { ...data, fog: data.fog ?? [] }]);
    setActiveId(data.id);
  };

  const remove = async () => {
    if (!board || !confirm(`Apagar "${board.name}"?`)) return;
    await deleteRow('tabletops', board.id).catch(() => {});
    const rest = boards.filter(b => b.id !== board.id);
    setBoards(rest);
    setActiveId(rest[0]?.id ?? null);
  };

  const uploadMap = async (f?: File) => {
    if (!f) return;
    patch({ map_url: await shrink(f, 2000, false) }, true);
    toast.success('Mapa carregado!');
  };

  const addTokenImg = (name: string, image: string) => {
    if (!board) return;
    patch({ tokens: [...board.tokens, { id: uid(), name, image, x: 45, y: 45, size: 8 }] }, true);
  };

  const uploadTokens = async (files: FileList | null) => {
    if (!files || !board) return;
    const added: Token[] = [];
    for (const f of Array.from(files)) {
      if (f.type !== 'image/png') toast.info('Prefira PNG com fundo transparente para os personagens.');
      added.push({ id: uid(), name: f.name.replace(/\.[^.]+$/, ''), image: await shrink(f, 300, true), x: 40 + added.length * 5, y: 45, size: 8 });
    }
    patch({ tokens: [...board.tokens, ...added] }, true);
  };

  const updateToken = (id: string, p: Partial<Token>, now = false) =>
    board && patch({ tokens: board.tokens.map(t => (t.id === id ? { ...t, ...p } : t)) }, now);

  const pct = (e: React.PointerEvent) => {
    const r = mapRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  // --- Tokens ---
  const onTokenDown = (e: React.PointerEvent, t: Token) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    const p = pct(e);
    drag.current = { id: t.id, dx: p.x - t.x, dy: p.y - t.y };
    setSelToken(t.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // --- Palco: pan / névoa / desselecionar ---
  const onStageDown = (e: React.PointerEvent) => {
    if (tool === 'pan') {
      const st = stageRef.current!;
      pan.current = { sx: e.clientX, sy: e.clientY, sl: st.scrollLeft, st: st.scrollTop };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'fog') {
      const p = pct(e);
      fogStart.current = p;
      setDraftFog({ id: 'draft', x: p.x, y: p.y, w: 0, h: 0 });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    setSelToken(null);
  };

  const onMove = (e: React.PointerEvent) => {
    if (pan.current && stageRef.current) {
      stageRef.current.scrollLeft = pan.current.sl - (e.clientX - pan.current.sx);
      stageRef.current.scrollTop = pan.current.st - (e.clientY - pan.current.sy);
      return;
    }
    if (fogStart.current) {
      const p = pct(e);
      const s = fogStart.current;
      setDraftFog({
        id: 'draft',
        x: Math.min(s.x, p.x), y: Math.min(s.y, p.y),
        w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y),
      });
      return;
    }
    if (!drag.current || !mapRef.current) return;
    const p = pct(e);
    updateToken(drag.current.id, {
      x: Math.max(0, Math.min(100, p.x - drag.current.dx)),
      y: Math.max(0, Math.min(100, p.y - drag.current.dy)),
    });
  };

  const onUp = () => {
    if (pan.current) { pan.current = null; return; }
    if (fogStart.current && board) {
      fogStart.current = null;
      if (draftFog && draftFog.w > 1 && draftFog.h > 1) {
        patch({ fog: [...(board.fog ?? []), { ...draftFog, id: uid() }] }, true);
      }
      setDraftFog(null);
      return;
    }
    if (drag.current) {
      updateToken(drag.current.id, {}, true);
      drag.current = null;
    }
  };

  const revealFog = (id: string) => {
    if (!board) return;
    patch({ fog: (board.fog ?? []).filter(f => f.id !== id) }, true);
  };

  const toggleFull = async () => {
    if (!document.fullscreenElement) await stageRef.current?.requestFullscreen?.().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
  };

  const share = () => {
    if (!board?.share_id) return toast.error('Este mapa ainda não tem link. Salve uma alteração e tente de novo.');
    const url = `${window.location.origin}${window.location.pathname}#/mapa-ao-vivo/${board.share_id}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copiado! Os jogadores veem o mapa em tempo real.');
  };

  const sel = board?.tokens.find(t => t.id === selToken);
  const fogCount = board?.fog?.length ?? 0;

  const toolBtn = (t: Tool, icon: React.ReactNode, label: string) => (
    <Button size="sm" variant={tool === t ? 'default' : 'outline'} className="h-9 gap-1" onClick={() => setTool(t)} title={label}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </Button>
  );

  return (
    <div className="space-y-5 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Tabletop</h1>
        <p className="text-sm text-muted-foreground mt-1">Carregue um mapa, cubra com névoa, revele na hora e compartilhe ao vivo</p>
      </motion.div>

      {/* Mapas salvos */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {boards.map(b => (
          <Button key={b.id} size="sm" variant={b.id === activeId ? 'default' : 'outline'} className="gap-1.5 shrink-0"
            onClick={() => { setActiveId(b.id); setSelToken(null); }}>
            <MapIcon className="w-3.5 h-3.5" />{b.name}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={create}><Plus className="w-3.5 h-3.5" />Novo mapa</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" />Carregando...</div>
      ) : !board ? (
        <Card><CardContent className="p-8 text-center space-y-3">
          <MapIcon className="w-10 h-10 mx-auto text-primary/60" />
          <p className="text-sm text-muted-foreground">Nenhum mapa ainda.</p>
          <Button onClick={create} className="gap-1"><Plus className="w-4 h-4" />Criar primeiro mapa</Button>
        </CardContent></Card>
      ) : (
        <>
          {/* Ferramentas */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-border/60 p-1">
              {toolBtn('move', <MousePointer2 className="w-4 h-4" />, 'Mover')}
              {toolBtn('pan', <Hand className="w-4 h-4" />, 'Mãozinha')}
              {toolBtn('fog', <Square className="w-4 h-4" />, 'Névoa')}
            </div>
            <Input className="h-9 w-36 sm:w-48" value={board.name} onChange={e => patch({ name: e.target.value })} />
            <label>
              <input type="file" accept="image/*" className="hidden" onChange={e => uploadMap(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm cursor-pointer hover:border-primary">
                <ImagePlus className="w-4 h-4" />{board.map_url ? 'Trocar mapa' : 'Carregar mapa'}
              </span>
            </label>
            <label>
              <input type="file" accept="image/png,image/*" multiple className="hidden" onChange={e => { uploadTokens(e.target.files); e.target.value = ''; }} />
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm cursor-pointer hover:border-primary">
                <UserPlus className="w-4 h-4" />Personagem (PNG)
              </span>
            </label>
            <Button size="sm" variant="outline" className="gap-1 h-9" onClick={() => setShowCast(v => !v)}><Users className="w-4 h-4" />Do elenco</Button>
            <Button size="sm" variant={board.grid ? 'default' : 'outline'} className="h-9" onClick={() => patch({ grid: !board.grid }, true)} title="Grade"><Grid3x3 className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => setZoom(z => Math.min(3, z + 0.25))}><ZoomIn className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" className="h-9" onClick={toggleFull}>{full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</Button>
            <Button size="sm" variant="secondary" className="h-9 gap-1" onClick={share} title="Copiar link ao vivo para os jogadores"><Share2 className="w-4 h-4" /><span className="hidden sm:inline">Compartilhar</span></Button>
            <Button size="sm" variant="outline" className="h-9 text-destructive" onClick={remove}><Trash2 className="w-4 h-4" /></Button>
          </div>

          {tool === 'fog' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5" /> Arraste para cobrir uma área com névoa preta. Clique num quadrado preto para revelar.
              {fogCount > 0 && (
                <button className="text-destructive underline" onClick={() => patch({ fog: [] }, true)}>Revelar tudo ({fogCount})</button>
              )}
            </p>
          )}

          {showCast && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {sheets.filter(s => s.image_url).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ficha com imagem no Elenco.</p>}
              {sheets.filter(s => s.image_url).map(s => (
                <button key={s.id} className="shrink-0 w-16 text-center" onClick={async () => addTokenImg(s.name, await shrink(s.image_url, 300, true))}>
                  <img src={s.image_url} alt={s.name} className="w-14 h-14 mx-auto rounded-full object-cover object-top ring-2 ring-primary/40" />
                  <span className="text-[10px] line-clamp-1">{s.name}</span>
                </button>
              ))}
            </div>
          )}

          {sel && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-2">
              <img src={sel.image} alt="" className="w-8 h-8 object-contain" />
              <Input className="h-8 w-40" value={sel.name} onChange={e => updateToken(sel.id, { name: e.target.value })} />
              <span className="text-xs text-muted-foreground">Tamanho</span>
              <input type="range" min={3} max={30} value={sel.size} className="w-32 accent-primary"
                onChange={e => updateToken(sel.id, { size: Number(e.target.value) })} />
              <Button size="sm" variant="ghost" className="text-destructive h-8"
                onClick={() => { patch({ tokens: board.tokens.filter(t => t.id !== sel.id) }, true); setSelToken(null); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div
            ref={stageRef}
            className={`overflow-auto rounded-xl border border-border/50 bg-background ${full ? 'flex items-center' : 'max-h-[75dvh]'} ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''} ${tool === 'fog' ? 'cursor-crosshair' : ''}`}
          >
            <div
              ref={mapRef}
              className="relative mx-auto select-none touch-none"
              style={{ width: `${zoom * 100}%`, minWidth: zoom * 320 }}
              onPointerDown={onStageDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              {board.map_url ? (
                <img src={board.map_url} alt={board.name} draggable={false} className="w-full block pointer-events-none" />
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground subtle-pattern">
                  <MapIcon className="w-10 h-10" /><p className="text-sm">Carregue a imagem do mapa</p>
                </div>
              )}
              {board.grid && (
                <div className="absolute inset-0 pointer-events-none opacity-40"
                  style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)/0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.4) 1px, transparent 1px)', backgroundSize: '5% 5%' }} />
              )}
              {(board.fog ?? []).map(f => (
                <button
                  key={f.id}
                  onClick={e => { e.stopPropagation(); revealFog(f.id); }}
                  title="Clique para revelar"
                  className="absolute bg-black/95 hover:bg-black/80 transition-colors group"
                  style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
                >
                  <Eye className="w-5 h-5 text-white/0 group-hover:text-white/60 absolute inset-0 m-auto" />
                </button>
              ))}
              {draftFog && (
                <div className="absolute bg-black/70 border border-dashed border-white/60 pointer-events-none"
                  style={{ left: `${draftFog.x}%`, top: `${draftFog.y}%`, width: `${draftFog.w}%`, height: `${draftFog.h}%` }} />
              )}
              {board.tokens.map(t => (
                <div key={t.id}
                  onPointerDown={e => onTokenDown(e, t)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.size}%` }}>
                  <img src={t.image} alt={t.name} draggable={false}
                    className={`w-full object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] ${selToken === t.id ? 'ring-2 ring-primary rounded-full' : ''}`} />
                  <p className="text-center text-[10px] sm:text-xs font-bold text-foreground bg-background/70 rounded px-1 mt-0.5 truncate">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Mover: arraste os personagens · Mãozinha: arraste o mapa · Névoa: cubra áreas e clique para revelar · Compartilhar: link ao vivo pros jogadores.
          </p>
        </>
      )}
    </div>
  );
};

export default Tabletop;
