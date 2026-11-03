import { useStageZoom } from '@/hooks/useStageZoom';
import { useEffect, useRef, useState } from 'react';
// A névoa fica POR CIMA dos personagens (z-20) — cobre bonecos também.
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Map as MapIcon, ImagePlus, UserPlus, Maximize2, Minimize2,
  Grid3x3, Loader2, ZoomIn, ZoomOut, Users, Hand, MousePointer2, Square, Share2, Eye, EyeOff, ScrollText, Copy, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { listRows, createRow, updateRow, deleteRow } from '@/lib/userData';
import { listSheets, Sheet } from '@/lib/sheets';
import { DiceBar, DiceAnimation, Roll } from '@/components/DiceBar';

interface Token {
  id: string;
  name: string;
  image: string;
  x: number; // % do mapa
  y: number;
  size: number; // % da largura do mapa
}
interface FogRect { id: string; x: number; y: number; w: number; h: number }
interface Board {
  id: string;
  name: string;
  map_url: string;
  tokens: Token[];
  grid: boolean;
  fog: FogRect[];
  share_id?: string;
  zoom?: number;
  camera_x?: number;
  camera_y?: number;
  last_roll?: Roll | null;
  room_id?: string;
  is_current?: boolean;
  view_enabled?: boolean;
}

type Tool = 'move' | 'pan' | 'fog';

const uid = () => Math.random().toString(36).slice(2, 10);
const ROOM_KEY = 'arcanum-tabletop-room';

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
  const [full, setFull] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [showCast, setShowCast] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [tool, setTool] = useState<Tool>('move');
  const [draftFog, setDraftFog] = useState<FogRect | null>(null);
  const [animRoll, setAnimRoll] = useState<Roll | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: { x: number; y: number }; orig: Record<string, { x: number; y: number }> } | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [multiMode, setMultiMode] = useState(false);
  const busyUntil = useRef(0);
  const pan = useRef<{ sx: number; sy: number; sl: number; st: number } | null>(null);
  const fogStart = useRef<{ x: number; y: number } | null>(null);
  const saveT = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    listRows<Board>('tabletops')
      .then(list => {
        const room = localStorage.getItem(ROOM_KEY) || list.find(b => b.room_id)?.room_id || uid() + uid();
        localStorage.setItem(ROOM_KEY, room);
        const hasPersistedRoom = list.some(b => Boolean(b.room_id));
        const hasCurrent = list.some(b => b.is_current);
        const next = list.map((b, i) => ({ ...b, room_id: hasPersistedRoom ? room : undefined, is_current: hasCurrent ? !!b.is_current : i === 0, view_enabled: b.view_enabled !== false, fog: b.fog ?? [] }));
        setBoards(next); setActiveId(next.find(b => b.is_current)?.id ?? next[0]?.id ?? null);
        Promise.all(next.map(b => updateRow('tabletops', b.id, { room_id: b.room_id, is_current: b.is_current, view_enabled: b.view_enabled } as any).catch(() => {})));
      })
      .catch(() => toast.error('Não consegui carregar os mapas.'))
      .finally(() => setLoading(false));
    listSheets().then(setSheets).catch(() => {});
    const h = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // Puxa as mudanças feitas pelos jogadores no link (bonecos e dados)
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => {
      if (document.hidden || drag.current || Date.now() < busyUntil.current) return;
      listRows<Board>('tabletops').then(list => {
        if (drag.current || Date.now() < busyUntil.current) return;
        const f = list.find(b => b.id === activeId);
        if (!f) return;
        setBoards(prev => prev.map(b => b.id === f.id ? { ...b, tokens: f.tokens, last_roll: (f as any).last_roll } as Board : b));
        const lr = (f as any).last_roll as Roll | null;
        if (lr && lr.at > lastSeenRoll.current) { lastSeenRoll.current = lr.at; if (lr.by !== 'Mestre') setAnimRoll(lr); }
      }).catch(() => {});
    }, 1500);
    return () => clearInterval(t);
  }, [activeId]);
  const lastSeenRoll = useRef(Date.now());

  const board = boards.find(b => b.id === activeId) ?? null;
  const zoom = board?.zoom ?? 1;
  const zoomCtl = useStageZoom(stageRef, zoom, z => { patch({ zoom: z }); requestAnimationFrame(syncCamera); }, () => { drag.current = null; pan.current = null; fogStart.current = null; setDraftFog(null); });

  const patch = (p: Partial<Board>, now = false) => {
    if (!board) return;
    const id = board.id;
    busyUntil.current = Date.now() + 2500;
    setBoards(prev => prev.map(b => (b.id === id ? { ...b, ...p } : b)));
    clearTimeout(saveT.current);
    const run = () => updateRow('tabletops', id, p as any).catch(() => toast.error('Não consegui salvar.'));
    if (now) run(); else saveT.current = setTimeout(run, 150);
  };

  // Salva a posição relativa da janela para que todos acompanhem o enquadramento do Mestre.
  const syncCamera = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const maxX = Math.max(0, stage.scrollWidth - stage.clientWidth);
    const maxY = Math.max(0, stage.scrollHeight - stage.clientHeight);
    patch({
      camera_x: maxX ? stage.scrollLeft / maxX : 0,
      camera_y: maxY ? stage.scrollTop / maxY : 0,
    });
  };

  // Atalhos de teclado: M mover, H mãozinha, N névoa, G grade, F tela cheia, +/- zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === 'm') setTool('move');
      else if (k === 'h') setTool('pan');
      else if (k === 'n') setTool('fog');
      else if (k === 'g') patch({ grid: !board?.grid }, true);
      else if (k === 'f') toggleFull();
      else if (k === '+' || k === '=') zoomCtl.zoomIn();
      else if (k === '-') zoomCtl.zoomOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const activate = async (id: string) => {
    const room = localStorage.getItem(ROOM_KEY) || board?.room_id;
    if (!room) return;
    const next = boards.map(b => ({ ...b, room_id: room, is_current: b.id === id }));
    setBoards(next); setActiveId(id); setSelToken(null);
    await Promise.all(next.map(b => updateRow('tabletops', b.id, { room_id: room, is_current: b.id === id } as any).catch(() => {})));
  };

  const create = async () => {
    const room = localStorage.getItem(ROOM_KEY) || uid() + uid();
    localStorage.setItem(ROOM_KEY, room);
    let data: Board;
    try { data = await createRow<Board>('tabletops', { name: `Mapa ${boards.length + 1}`, room_id: room, is_current: boards.length === 0, view_enabled: true }); }
    catch { return toast.error('Não consegui criar o mapa.'); }
    setBoards(prev => [...prev, { ...data, room_id: data.room_id, is_current: data.is_current ?? boards.length === 0, view_enabled: data.view_enabled !== false, fog: data.fog ?? [] }]);
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

  const onTokenDown = (e: React.PointerEvent, t: Token) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    const p = pct(e);
    const additive = multiMode || e.shiftKey || e.ctrlKey || e.metaKey;
    let group = multi;
    if (additive) {
      group = multi.includes(t.id) ? multi.filter(x => x !== t.id) : [...multi, t.id];
      setMulti(group);
    } else if (!multi.includes(t.id)) { group = [t.id]; setMulti(group); }
    const ids = group.includes(t.id) ? group : [t.id];
    const orig: Record<string, { x: number; y: number }> = {};
    board!.tokens.forEach(k => { if (ids.includes(k.id)) orig[k.id] = { x: k.x, y: k.y }; });
    drag.current = { start: p, orig };
    setSelToken(t.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

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
    if (!multiMode) setMulti([]);
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
    const { start, orig } = drag.current;
    const dx = p.x - start.x, dy = p.y - start.y;
    if (!board) return;
    patch({ tokens: board.tokens.map(t => orig[t.id] ? { ...t, x: Math.max(0, Math.min(100, orig[t.id].x + dx)), y: Math.max(0, Math.min(100, orig[t.id].y + dy)) } : t) });
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
      drag.current = null;
      if (board) patch({ tokens: board.tokens }, true);
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

  const shareUrl = board?.room_id ? `${window.location.origin}/#/mapa-ao-vivo/${board.room_id}` : board?.share_id ? `${window.location.origin}/#/mapa-ao-vivo/${board.share_id}` : '';

  const copyShare = async () => {
    if (!shareUrl) return toast.error('Este mapa ainda não tem link. Salve uma alteração e tente de novo.');
    try { await navigator.clipboard.writeText(shareUrl); toast.success('Link da mesa copiado.'); }
    catch { toast.error('Não consegui copiar. Selecione o link e copie manualmente.'); }
  };

  const share = async () => {
    if (!shareUrl) return toast.error('Este mapa ainda não tem link. Salve uma alteração e tente de novo.');
    setShowShare(true);
    if (navigator.share) {
      try { await navigator.share({ title: `Mesa — ${board?.name ?? 'Arcanum'}`, text: 'Entre na mesa ao vivo pelo Arcanum.', url: shareUrl }); }
      catch { /* o jogador fechou a folha de compartilhamento */ }
    } else await copyShare();
  };

  const rollDice = (roll: Roll) => {
    const r = { ...roll, by: 'Mestre' };
    setAnimRoll(r);
    patch({ last_roll: r }, true);
  };

  const sel = board?.tokens.find(t => t.id === selToken);
  const fogCount = board?.fog?.length ?? 0;
  const tableSheets = sheets.filter(s => s.in_list);
  const ViewIcon = board?.view_enabled === false ? Eye : EyeOff;

  const toolBtn = (t: Tool, icon: React.ReactNode, label: string, keyHint: string) => (
    <Button size="sm" variant={tool === t ? 'default' : 'outline'} className="h-9 gap-1" onClick={() => setTool(t)} title={`${label} (tecla ${keyHint})`}>
      {icon}<span className="hidden sm:inline">{label}</span>
      <kbd className="hidden md:inline text-[9px] opacity-60 border border-current rounded px-0.5">{keyHint}</kbd>
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
            onClick={() => activate(b.id)}>
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
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:overflow-visible">
            <div className="flex gap-1 rounded-lg border border-border/60 p-1">
              {toolBtn('move', <MousePointer2 className="w-4 h-4" />, 'Mover', 'M')}
              {toolBtn('pan', <Hand className="w-4 h-4" />, 'Mãozinha', 'H')}
              {toolBtn('fog', <Square className="w-4 h-4" />, 'Névoa', 'N')}
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
            <Button size="sm" variant={board.grid ? 'default' : 'outline'} className="h-9" onClick={() => patch({ grid: !board.grid }, true)} title="Grade (G)"><Grid3x3 className="w-4 h-4" /></Button>
            <Button size="sm" variant={multiMode ? 'default' : 'outline'} className="h-9" title="Selecionar vários (ou segure Shift)" onClick={() => { setMultiMode(m => !m); if (multiMode) setMulti([]); }}>
              {multiMode ? `Selecionando (${multi.length})` : 'Selecionar vários'}
            </Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => zoomCtl.zoomOut()}><ZoomOut className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => zoomCtl.zoomIn()}><ZoomIn className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" className="h-9 px-2 tabular-nums text-xs" onClick={() => zoomCtl.reset()}>{Math.round(zoom * 100)}%</Button>
            <Button size="sm" variant="outline" className="h-9" onClick={toggleFull}>{full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</Button>
            <Button size="sm" variant={showSummary ? 'default' : 'outline'} className="h-9 gap-1" onClick={() => setShowSummary(v => !v)} title="Resumo das fichas na mesa"><ScrollText className="w-4 h-4" /><span className="hidden sm:inline">Fichas</span></Button>
            <Button size="sm" variant="secondary" className="h-9 gap-1" onClick={share} title="Copiar link ao vivo para os jogadores"><Share2 className="w-4 h-4" /><span className="hidden sm:inline">Compartilhar</span></Button>
            <Button size="sm" variant={board.view_enabled === false ? 'default' : 'outline'} className="h-9 gap-1" onClick={() => patch({ view_enabled: board.view_enabled === false }, true)} title="Pausar ou liberar a visão dos jogadores"><ViewIcon className="w-4 h-4" /><span className="hidden sm:inline">{board.view_enabled === false ? 'Liberar visão' : 'Cancelar visualização'}</span></Button>
            <Button size="sm" variant="outline" className="h-9 text-destructive" onClick={remove}><Trash2 className="w-4 h-4" /></Button>
          </div>

          {showShare && shareUrl && (
            <Card className="border-primary/30 bg-card/95 shadow-lg">
              <CardContent className="p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Convide os jogadores</p><p className="text-xs text-muted-foreground">Eles poderão ver o mapa, mover personagens e rolar dados em tempo real.</p></div>
                <div className="flex gap-2 min-w-0 sm:w-[28rem]"><Input readOnly value={shareUrl} className="h-9 min-w-0 text-xs" onFocus={e => e.currentTarget.select()} /><Button size="sm" className="h-9 shrink-0 gap-1" onClick={copyShare}><Copy className="w-4 h-4" /><span className="hidden sm:inline">Copiar</span></Button><Button size="sm" variant="ghost" className="h-9 shrink-0 px-2" onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')} title="Abrir como jogador"><ExternalLink className="w-4 h-4" /></Button></div>
              </CardContent>
            </Card>
          )}

          {tool === 'fog' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
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

          <div className="flex gap-3 items-start">
            <div
              ref={stageRef}
              onScroll={syncCamera}
              className={`relative flex-1 min-w-0 overflow-auto rounded-xl border border-border/50 bg-background min-h-[58dvh] ${full ? 'flex items-center' : 'max-h-[calc(100dvh-13rem)] sm:max-h-[75dvh]'} ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''} ${tool === 'fog' ? 'cursor-crosshair' : ''}`}
            >
              <div
                ref={mapRef}
                className="relative mx-auto select-none touch-none"
                style={{ width: `${zoom * 100}%` }}
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
                    className="absolute z-20 bg-black/95 hover:bg-black/80 transition-colors group"
                    style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
                  >
                    <Eye className="w-5 h-5 text-white/0 group-hover:text-white/60 absolute inset-0 m-auto" />
                  </button>
                ))}
                {draftFog && (
                  <div className="absolute z-20 bg-black/70 border border-dashed border-white/60 pointer-events-none"
                    style={{ left: `${draftFog.x}%`, top: `${draftFog.y}%`, width: `${draftFog.w}%`, height: `${draftFog.h}%` }} />
                )}
                {board.tokens.map(t => (
                  <div key={t.id}
                    onPointerDown={e => onTokenDown(e, t)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                    style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.size}%` }}>
                    <img src={t.image} alt={t.name} draggable={false}
                      className={`w-full object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] ${multi.includes(t.id) || selToken === t.id ? 'ring-2 ring-primary rounded-full shadow-[0_0_16px_hsl(var(--primary))]' : ''}`} />
                    <p className="text-center text-[10px] sm:text-xs font-bold text-foreground bg-background/70 rounded px-1 mt-0.5 truncate">{t.name}</p>
                  </div>
                ))}
              </div>
              {/* Barra de dados flutuante */}
              <div className="sticky bottom-2 flex justify-center pointer-events-none">
                <div className="pointer-events-auto"><DiceBar onRoll={rollDice} /></div>
              </div>
            </div>

            {/* Resumo das fichas na mesa (só o mestre vê esta página) */}
            {showSummary && (
              <Card className="w-56 shrink-0 hidden md:block glass-card">
                <CardContent className="p-3 space-y-3 max-h-[75dvh] overflow-y-auto">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Fichas na mesa</p>
                  {tableSheets.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ficha na mesa. Use "Mandar pra mesa" no Elenco.</p>}
                  {tableSheets.map(s => (
                    <div key={s.id} className="space-y-1">
                      <p className="text-xs font-bold truncate">{s.name}</p>
                      {s.resources.map(r => (
                        <div key={r.id} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{r.short}</span><span>{r.current}/{r.max}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${r.max ? (r.current / r.max) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Atalhos: <kbd className="border border-border rounded px-1">M</kbd> mover · <kbd className="border border-border rounded px-1">H</kbd> mãozinha · <kbd className="border border-border rounded px-1">N</kbd> névoa · <kbd className="border border-border rounded px-1">G</kbd> grade · <kbd className="border border-border rounded px-1">F</kbd> tela cheia · <kbd className="border border-border rounded px-1">+</kbd>/<kbd className="border border-border rounded px-1">-</kbd> zoom · roda do mouse ou pinça com dois dedos (o zoom aparece igual para os jogadores)
          </p>
        </>
      )}
      <DiceAnimation roll={animRoll} />
    </div>
  );
};

export default Tabletop;
