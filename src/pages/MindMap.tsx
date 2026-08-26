import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Trash2, Link2, ZoomIn, ZoomOut, Crosshair, Pencil, Network, Download, Upload,
  Maximize2, Minimize2, Image as ImageIcon, Undo2, Redo2, Search, Grid3x3, Copy,
  Lightbulb, User, MapPin, Skull, ScrollText, KeyRound, X, Layers,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ────────────────────────────── modelo ────────────────────────────── */

type NodeKind = 'ideia' | 'npc' | 'local' | 'pista' | 'ameaca' | 'trama';

interface MapNode {
  id: string;
  x: number;
  y: number;
  title: string;
  text?: string;
  color: string;
  kind?: NodeKind;
}
interface MapEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}
interface MindMapData {
  nodes: MapNode[];
  edges: MapEdge[];
}
interface MindMapDoc {
  id: string;
  name: string;
  data: MindMapData;
}


const KINDS: { key: NodeKind; label: string; icon: typeof Lightbulb }[] = [
  { key: 'ideia', label: 'Ideia', icon: Lightbulb },
  { key: 'npc', label: 'NPC', icon: User },
  { key: 'local', label: 'Local', icon: MapPin },
  { key: 'pista', label: 'Pista', icon: KeyRound },
  { key: 'ameaca', label: 'Ameaça', icon: Skull },
  { key: 'trama', label: 'Trama', icon: ScrollText },
];

const COLORS: { key: string; label: string; css: string }[] = [
  { key: 'primary', label: 'Primária', css: 'hsl(var(--primary))' },
  { key: 'gold', label: 'Ouro', css: 'hsl(var(--gold))' },
  { key: 'ember', label: 'Brasa', css: 'hsl(var(--ember))' },
  { key: 'muted', label: 'Neutra', css: 'hsl(var(--muted-foreground))' },
  { key: 'red', label: 'Sangue', css: 'hsl(0 78% 55%)' },
  { key: 'orange', label: 'Laranja', css: 'hsl(24 92% 55%)' },
  { key: 'amber', label: 'Âmbar', css: 'hsl(43 96% 56%)' },
  { key: 'lime', label: 'Limo', css: 'hsl(84 70% 50%)' },
  { key: 'green', label: 'Esmeralda', css: 'hsl(150 65% 45%)' },
  { key: 'teal', label: 'Turquesa', css: 'hsl(174 70% 45%)' },
  { key: 'cyan', label: 'Gelo', css: 'hsl(190 90% 55%)' },
  { key: 'blue', label: 'Arcano', css: 'hsl(217 90% 60%)' },
  { key: 'indigo', label: 'Índigo', css: 'hsl(250 75% 65%)' },
  { key: 'purple', label: 'Sombra', css: 'hsl(280 70% 62%)' },
  { key: 'pink', label: 'Feitiço', css: 'hsl(330 80% 62%)' },
  { key: 'rose', label: 'Rosa', css: 'hsl(350 80% 62%)' },
  { key: 'slate', label: 'Pedra', css: 'hsl(215 15% 62%)' },
  { key: 'white', label: 'Osso', css: 'hsl(40 25% 90%)' },
];

const COLOR_MAP = Object.fromEntries(COLORS.map(c => [c.key, c.css]));
const colorVar = (key: string) => COLOR_MAP[key] ?? 'hsl(var(--primary))';


const NODE_W = 180;
const GRID = 24;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const nodeH = (n: MapNode) => (n.text?.trim() ? 92 : 56);

const resolveColor = (css: string) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const out = getComputedStyle(probe).color || '#ffffff';
  probe.remove();
  return out;
};

/** ponto na borda do bloco em direção ao outro bloco */
const anchorPoint = (a: MapNode, b: MapNode) => {
  const ah = nodeH(a);
  const cx = a.x + NODE_W / 2, cy = a.y + ah / 2;
  const dx = (b.x + NODE_W / 2) - cx, dy = (b.y + nodeH(b) / 2) - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const t = Math.min(
    Math.abs(dx) > 0.01 ? (NODE_W / 2 + 6) / Math.abs(dx) : Infinity,
    Math.abs(dy) > 0.01 ? (ah / 2 + 6) / Math.abs(dy) : Infinity,
  );
  return { x: cx + dx * t, y: cy + dy * t };
};

const edgePath = (a: MapNode, b: MapNode) => {
  const p1 = anchorPoint(a, b), p2 = anchorPoint(b, a);
  const dx = Math.abs(p2.x - p1.x), dy = Math.abs(p2.y - p1.y);
  if (dx >= dy) {
    const c = Math.max(40, dx * 0.45);
    return { p1, p2, d: `M ${p1.x} ${p1.y} C ${p1.x + Math.sign(p2.x - p1.x) * c} ${p1.y}, ${p2.x - Math.sign(p2.x - p1.x) * c} ${p2.y}, ${p2.x} ${p2.y}` };
  }
  const c = Math.max(40, dy * 0.45);
  return { p1, p2, d: `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + Math.sign(p2.y - p1.y) * c}, ${p2.x} ${p2.y - Math.sign(p2.y - p1.y) * c}, ${p2.x} ${p2.y}` };
};

/* ────────────────────────────── página ────────────────────────────── */

const EMPTY: MindMapData = { nodes: [], edges: [] };

const MindMap = () => {
  /* múltiplos mapas salvos */
  const [docs, setDocs] = useLocalStorage<MindMapDoc[]>('arcanum-mindmaps', []);
  const [activeId, setActiveId] = useLocalStorage<string>('arcanum-mindmap-active', '');
  const [mapsOpen, setMapsOpen] = useState(false);

  // migração do mapa único antigo + garantia de ao menos um mapa
  useEffect(() => {
    if (docs.length) {
      if (!docs.some(d => d.id === activeId)) setActiveId(docs[0].id);
      return;
    }
    let legacy: MindMapData = EMPTY;
    try {
      const raw = localStorage.getItem('arcanum-mindmap');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.nodes)) legacy = { nodes: parsed.nodes, edges: parsed.edges ?? [] };
      }
    } catch { /* ignora */ }
    const first: MindMapDoc = { id: uid(), name: 'Mapa 1', data: legacy };
    setDocs([first]);
    setActiveId(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs.length]);

  const activeDoc = docs.find(d => d.id === activeId) ?? docs[0];
  const data = activeDoc?.data ?? EMPTY;

  const setData = useCallback((value: MindMapData | ((prev: MindMapData) => MindMapData)) => {
    setDocs(prev => prev.map(d => (d.id === (activeId || prev[0]?.id)
      ? { ...d, data: value instanceof Function ? value(d.data) : value }
      : d)));
  }, [setDocs, activeId]);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<MapNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<MapEdge | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [snap, setSnap] = useState(true);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [linking, setLinking] = useState<{ from: string; x: number; y: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<{ dist: number; scale: number; cx: number; cy: number; panX: number; panY: number } | null>(null);
  const drag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const stateRef = useRef({ scale, pan });
  stateRef.current = { scale, pan };

  const history = useRef<{ past: MindMapData[]; future: MindMapData[] }>({ past: [], future: [] });
  const [histTick, setHistTick] = useState(0);

  const nodeById = useMemo(() => Object.fromEntries(data.nodes.map(n => [n.id, n])), [data.nodes]);

  /** muda o mapa registrando histórico (use para ações discretas) */
  const commit = useCallback((updater: (prev: MindMapData) => MindMapData) => {
    setData(prev => {
      history.current.past = [...history.current.past.slice(-49), prev];
      history.current.future = [];
      return updater(prev);
    });
    setHistTick(t => t + 1);
  }, [setData]);

  const undo = useCallback(() => {
    setData(prev => {
      const last = history.current.past.pop();
      if (!last) return prev;
      history.current.future = [prev, ...history.current.future.slice(0, 49)];
      return last;
    });
    setHistTick(t => t + 1);
  }, [setData]);

  const redo = useCallback(() => {
    setData(prev => {
      const next = history.current.future.shift();
      if (!next) return prev;
      history.current.past = [...history.current.past, prev];
      return next;
    });
    setHistTick(t => t + 1);
  }, [setData]);

  /* ── zoom ── */
  const zoomAt = useCallback((next: number, px: number, py: number) => {
    const { scale: z, pan: p } = stateRef.current;
    const clamped = clamp(next, MIN_ZOOM, MAX_ZOOM);
    const k = clamped / z;
    setPan({ x: px - (px - p.x) * k, y: py - (py - p.y) * k });
    setScale(clamped);
  }, []);

  const zoomButton = useCallback((factor: number) => {
    const r = wrapRef.current?.getBoundingClientRect();
    zoomAt(stateRef.current.scale * factor, (r?.width ?? 400) / 2, (r?.height ?? 400) / 2);
  }, [zoomAt]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
        const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
        if (!e.ctrlKey && e.shiftKey) { setPan(p => ({ x: p.x - dy, y: p.y })); return; }
        zoomAt(stateRef.current.scale * Math.exp(-dy * 0.0015), e.clientX - r.left, e.clientY - r.top);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt, fullscreen]);

  /* ── posições ── */
  const toWorld = (clientX: number, clientY: number) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left - pan.x) / scale, y: (clientY - r.top - pan.y) / scale };
  };
  const snapVal = (v: number) => (snap ? Math.round(v / GRID) * GRID : Math.round(v));

  /* ── criar / apagar ── */
  const addNodeAt = (wx: number, wy: number, kind: NodeKind = 'ideia') => {
    const node: MapNode = {
      id: uid(),
      x: snapVal(wx - NODE_W / 2), y: snapVal(wy - 28),
      title: KINDS.find(k => k.key === kind)?.label ?? 'Nova ideia',
      text: '', color: 'primary', kind,
    };
    commit(prev => ({ ...prev, nodes: [...prev.nodes, node] }));
    setSelected(node.id);
    return node;
  };

  const addNodeCenter = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    const wx = ((r?.width ?? 400) / 2 - pan.x) / scale;
    const wy = ((r?.height ?? 400) / 2 - pan.y) / scale;
    setEditing(addNodeAt(wx, wy));
  };

  const removeNode = (id: string) => {
    commit(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.from !== id && e.to !== id),
    }));
    setSelected(null);
  };

  const duplicateNode = (n: MapNode) => {
    const copy = { ...n, id: uid(), x: n.x + GRID, y: n.y + GRID };
    commit(prev => ({ ...prev, nodes: [...prev.nodes, copy] }));
    setSelected(copy.id);
  };

  const connect = (from: string, to: string) => {
    if (from === to) return;
    commit(prev => {
      const exists = prev.edges.some(e =>
        (e.from === from && e.to === to) || (e.from === to && e.to === from));
      if (exists) return prev;
      return { ...prev, edges: [...prev.edges, { id: uid(), from, to, style: 'solid' }] };
    });
  };

  /* ── gestos ── */
  const onCanvasPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const r = wrapRef.current!.getBoundingClientRect();
      gesture.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale, cx: (a.x + b.x) / 2 - r.left, cy: (a.y + b.y) / 2 - r.top,
        panX: pan.x, panY: pan.y,
      };
      panRef.current = null;
      drag.current = null;
      return;
    }
    if (drag.current || linking) return;
    panRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
    setSelected(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // pinça
    if (pointers.current.size >= 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const g = gesture.current;
      const next = clamp(g.scale * (dist / (g.dist || 1)), MIN_ZOOM, MAX_ZOOM);
      const k = next / g.scale;
      setScale(next);
      setPan({ x: g.cx - (g.cx - g.panX) * k, y: g.cy - (g.cy - g.panY) * k });
      return;
    }

    // ligação em andamento
    if (linking) {
      const w = toWorld(e.clientX, e.clientY);
      setLinking(l => (l ? { ...l, x: w.x, y: w.y } : l));
      return;
    }

    // arraste de bloco
    const d = drag.current;
    if (d) {
      const dx = (e.clientX - d.sx) / scale;
      const dy = (e.clientY - d.sy) / scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
      setData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === d.id
          ? { ...n, x: snapVal(d.ox + dx), y: snapVal(d.oy + dy) }
          : n),
      }));
      return;
    }

    // pan
    const p = panRef.current;
    if (p) setPan({ x: p.x + (e.clientX - p.px), y: p.y + (e.clientY - p.py) });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    if (drag.current?.moved) { history.current.future = []; setHistTick(t => t + 1); }
    drag.current = null;
    panRef.current = null;
    if (linking) setLinking(null);
  };

  const onNodePointerDown = (e: React.PointerEvent, node: MapNode) => {
    if (pointers.current.size >= 1 && gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    history.current.past = [...history.current.past.slice(-49), data];
    drag.current = { id: node.id, ox: node.x, oy: node.y, sx: e.clientX, sy: e.clientY, moved: false };
    setSelected(node.id);
  };

  const startLink = (e: React.PointerEvent, node: MapNode) => {
    e.stopPropagation();
    const w = toWorld(e.clientX, e.clientY);
    setLinking({ from: node.id, x: w.x, y: w.y });
  };

  const finishLinkOn = (id: string) => {
    if (!linking) return false;
    connect(linking.from, id);
    setLinking(null);
    return true;
  };

  /* ── enquadrar / centralizar ── */
  const fitView = useCallback(() => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!data.nodes.length || !r) { setScale(1); setPan({ x: 0, y: 0 }); return; }
    const minX = Math.min(...data.nodes.map(n => n.x));
    const minY = Math.min(...data.nodes.map(n => n.y));
    const maxX = Math.max(...data.nodes.map(n => n.x + NODE_W));
    const maxY = Math.max(...data.nodes.map(n => n.y + nodeH(n)));
    const z = clamp(Math.min((r.width - 60) / Math.max(1, maxX - minX), (r.height - 60) / Math.max(1, maxY - minY)), MIN_ZOOM, 1.2);
    setScale(z);
    setPan({ x: r.width / 2 - ((minX + maxX) / 2) * z, y: r.height / 2 - ((minY + maxY) / 2) * z });
  }, [data.nodes]);

  const centerOn = (n: MapNode) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const z = Math.max(scale, 0.8);
    setScale(z);
    setPan({ x: r.width / 2 - (n.x + NODE_W / 2) * z, y: r.height / 2 - (n.y + nodeH(n) / 2) * z });
    setSelected(n.id);
  };

  /* ── teclado ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') { setFullscreen(false); setLinking(null); setSelected(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); removeNode(selected); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selected && nodeById[selected]) {
        e.preventDefault(); duplicateNode(nodeById[selected]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  /* ── import / export ── */
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arcanum-mapa-mental.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.nodes)) throw new Error('formato');
        commit(() => ({ nodes: parsed.nodes, edges: parsed.edges ?? [] }));
        toast({ title: 'Mapa importado!' });
        setTimeout(fitView, 80);
      } catch {
        toast({ title: 'Arquivo inválido', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const exportPng = () => {
    if (!data.nodes.length) { toast({ title: 'Mapa vazio' }); return; }
    const pad = 90;
    const minX = Math.min(...data.nodes.map(n => n.x)) - pad;
    const minY = Math.min(...data.nodes.map(n => n.y)) - pad;
    const maxX = Math.max(...data.nodes.map(n => n.x + NODE_W)) + pad;
    const maxY = Math.max(...data.nodes.map(n => n.y + nodeH(n))) + pad;
    const w = maxX - minX, h = maxY - minY;
    const dpr = 2;
    const cv = document.createElement('canvas');
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.translate(-minX, -minY);

    const bg = resolveColor('hsl(var(--background))');
    const gridC = resolveColor('hsl(var(--border))');
    const mutedC = resolveColor('hsl(var(--muted-foreground))');
    const cardC = resolveColor('hsl(var(--card))');

    ctx.fillStyle = bg; ctx.fillRect(minX, minY, w, h);
    ctx.strokeStyle = gridC; ctx.globalAlpha = 0.3; ctx.lineWidth = 1;
    for (let x = Math.floor(minX / GRID) * GRID; x < maxX; x += GRID) { ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, maxY); ctx.stroke(); }
    for (let y = Math.floor(minY / GRID) * GRID; y < maxY; y += GRID) { ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke(); }
    ctx.globalAlpha = 1;

    data.edges.forEach(e => {
      const a = nodeById[e.from], b = nodeById[e.to];
      if (!a || !b) return;
      const { p1, p2 } = edgePath(a, b);
      const c = resolveColor(colorVar(a.color));
      ctx.strokeStyle = c; ctx.lineWidth = 2.5;
      ctx.setLineDash(e.style === 'dashed' ? [8, 6] : []);
      const mx = (p1.x + p2.x) / 2;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(mx, p1.y, mx, p2.y, p2.x, p2.y);
      ctx.stroke(); ctx.setLineDash([]);
      const ang = Math.atan2(p2.y - p1.y, p2.x - mx);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - 11 * Math.cos(ang - 0.4), p2.y - 11 * Math.sin(ang - 0.4));
      ctx.lineTo(p2.x - 11 * Math.cos(ang + 0.4), p2.y - 11 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
      if (e.label) {
        ctx.font = '600 12px Rajdhani, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lx = (p1.x + p2.x) / 2, ly = (p1.y + p2.y) / 2;
        const tw = ctx.measureText(e.label).width + 10;
        ctx.fillStyle = bg; ctx.fillRect(lx - tw / 2, ly - 9, tw, 18);
        ctx.fillStyle = mutedC; ctx.fillText(e.label, lx, ly);
      }
    });

    data.nodes.forEach(n => {
      const c = resolveColor(colorVar(n.color));
      const hh = nodeH(n);
      ctx.fillStyle = cardC; ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(n.x, n.y, NODE_W, hh, 12); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = c; ctx.font = '700 14px Cinzel, serif';
      ctx.fillText(n.title.slice(0, 22), n.x + 12, n.y + 12);
      if (n.text) {
        ctx.fillStyle = mutedC; ctx.font = '400 12px Rajdhani, sans-serif';
        const words = n.text.split(/\s+/);
        let line = '', ly = n.y + 36, lines = 0;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > NODE_W - 24) {
            ctx.fillText(line, n.x + 12, ly); line = word; ly += 15; lines++;
            if (lines >= 3) { line = ''; break; }
          } else line = test;
        }
        if (line) ctx.fillText(line, n.x + 12, ly);
      }
    });

    cv.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'arcanum-mapa-mental.png';
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: 'Imagem exportada!' });
    }, 'image/png');
  };

  /* ── minimapa ── */
  const minimap = useMemo(() => {
    if (data.nodes.length < 2) return null;
    const minX = Math.min(...data.nodes.map(n => n.x));
    const minY = Math.min(...data.nodes.map(n => n.y));
    const maxX = Math.max(...data.nodes.map(n => n.x + NODE_W));
    const maxY = Math.max(...data.nodes.map(n => n.y + nodeH(n)));
    const w = 132, h = 92;
    const k = Math.min(w / Math.max(1, maxX - minX), h / Math.max(1, maxY - minY));
    return { minX, minY, w, h, k };
  }, [data.nodes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return data.nodes.filter(n =>
      n.title.toLowerCase().includes(q) || (n.text ?? '').toLowerCase().includes(q)).slice(0, 8);
  }, [query, data.nodes]);

  /* ── gestão de mapas salvos ── */
  const switchMap = (id: string) => {
    history.current = { past: [], future: [] };
    setActiveId(id);
    setSelected(null);
    setMapsOpen(false);
    setTimeout(fitView, 80);
  };

  const newMap = () => {
    const doc: MindMapDoc = { id: uid(), name: `Mapa ${docs.length + 1}`, data: { nodes: [], edges: [] } };
    setDocs(prev => [...prev, doc]);
    history.current = { past: [], future: [] };
    setActiveId(doc.id);
    setSelected(null);
    setScale(1); setPan({ x: 0, y: 0 });
    toast({ title: 'Novo mapa criado', description: 'Os anteriores continuam salvos.' });
  };

  const duplicateMap = (doc: MindMapDoc) => {
    const copy: MindMapDoc = { id: uid(), name: `${doc.name} (cópia)`, data: JSON.parse(JSON.stringify(doc.data)) };
    setDocs(prev => [...prev, copy]);
    setActiveId(copy.id);
    toast({ title: 'Mapa duplicado' });
  };

  const renameMap = (id: string, name: string) =>
    setDocs(prev => prev.map(d => (d.id === id ? { ...d, name } : d)));

  const deleteMap = (id: string) => {
    setDocs(prev => {
      const rest = prev.filter(d => d.id !== id);
      if (!rest.length) {
        const fresh: MindMapDoc = { id: uid(), name: 'Mapa 1', data: { nodes: [], edges: [] } };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(rest[0].id);
      return rest;
    });
    history.current = { past: [], future: [] };
  };

  /* ────────────────────────────── UI ────────────────────────────── */

  const iconBtn = 'h-10 w-10 md:h-9 md:w-9';

  const mapsBar = (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      {docs.map(d => (
        <button key={d.id} onClick={() => switchMap(d.id)}
          className={`shrink-0 px-3 h-9 rounded-full border text-sm font-semibold transition ${
            d.id === activeDoc?.id
              ? 'bg-primary/15 border-primary text-primary'
              : 'border-border/60 text-muted-foreground hover:text-foreground'
          }`}>
          {d.name}
          <span className="ml-1.5 text-[10px] opacity-70">{d.data.nodes.length}</span>
        </button>
      ))}
      <Button variant="outline" size="sm" className="shrink-0 h-9 gap-1.5" onClick={newMap}>
        <Plus className="w-4 h-4" />Novo mapa
      </Button>
      <Button variant="ghost" size="sm" className="shrink-0 h-9 gap-1.5" onClick={() => setMapsOpen(true)}>
        <Layers className="w-4 h-4" />Gerenciar
      </Button>
    </div>
  );

  const toolbar = (

    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      <Button onClick={addNodeCenter} className="gap-2 shrink-0 h-10 md:h-9"><Plus className="w-4 h-4" />Bloco</Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Desfazer"
        disabled={!history.current.past.length} onClick={undo}><Undo2 className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Refazer"
        disabled={!history.current.future.length} onClick={redo}><Redo2 className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Diminuir" onClick={() => zoomButton(1 / 1.2)}><ZoomOut className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Aumentar" onClick={() => zoomButton(1.2)}><ZoomIn className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Enquadrar tudo" onClick={fitView}><Crosshair className="w-4 h-4" /></Button>
      <Button variant={searchOpen ? 'default' : 'outline'} size="icon" className={`${iconBtn} shrink-0`} title="Buscar"
        onClick={() => setSearchOpen(o => !o)}><Search className="w-4 h-4" /></Button>
      <Button variant={snap ? 'default' : 'outline'} size="icon" className={`${iconBtn} shrink-0`} title="Encaixar na grade"
        onClick={() => setSnap(s => !s)}><Grid3x3 className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Exportar imagem" onClick={exportPng}><ImageIcon className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title="Exportar JSON" onClick={exportJson}><Download className="w-4 h-4" /></Button>
      <label className="shrink-0">
        <input type="file" accept="application/json" className="hidden"
          onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} />
        <Button variant="outline" size="icon" className={iconBtn} title="Importar JSON" asChild><span><Upload className="w-4 h-4" /></span></Button>
      </label>
      <Button variant="outline" size="icon" className={`${iconBtn} shrink-0`} title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        onClick={() => setFullscreen(f => !f)}>
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>
      <Badge variant="outline" className="ml-auto shrink-0 tabular-nums hidden sm:flex">{Math.round(scale * 100)}%</Badge>
    </div>
  );

  const canvas = (
    <div
      ref={wrapRef}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={e => {
        const w = toWorld(e.clientX, e.clientY);
        setEditing(addNodeAt(w.x, w.y));
      }}
      className={`relative w-full overflow-hidden glass-card glow-border touch-none select-none ${
        fullscreen ? 'flex-1 rounded-xl' : 'h-[68dvh] md:h-[74dvh] rounded-xl'
      }`}
      style={{
        backgroundImage:
          'radial-gradient(hsl(var(--border)/0.8) 1px, transparent 1px)',
        backgroundSize: `${GRID * scale}px ${GRID * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
        <svg className="absolute overflow-visible" style={{ width: 1, height: 1 }}>
          <defs>
            {COLORS.map(c => (
              <marker key={c.key} id={`arrow-${c.key}`} viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={colorVar(c.key)} />
              </marker>
            ))}
          </defs>
          {data.edges.map(e => {
            const a = nodeById[e.from], b = nodeById[e.to];
            if (!a || !b) return null;
            const { p1, p2, d } = edgePath(a, b);
            const active = selected === a.id || selected === b.id;
            return (
              <g key={e.id} className="cursor-pointer"
                onPointerDown={ev => ev.stopPropagation()}
                onClick={ev => { ev.stopPropagation(); setEditingEdge(e); }}>
                <path d={d} fill="none" stroke="transparent" strokeWidth={18} />
                <path d={d} fill="none" stroke={colorVar(a.color)}
                  strokeOpacity={active ? 1 : 0.6}
                  strokeWidth={active ? 3 : 2.2}
                  strokeDasharray={e.style === 'dashed' ? '8 6' : undefined}
                  markerEnd={`url(#arrow-${a.color})`}
                  style={{ filter: active ? `drop-shadow(0 0 6px ${colorVar(a.color)})` : undefined, transition: 'stroke-width .15s' }} />
                {e.label && (
                  <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    className="fill-muted-foreground text-[11px] font-semibold"
                    style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 6 }}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {linking && nodeById[linking.from] && (
            <line
              x1={nodeById[linking.from].x + NODE_W / 2}
              y1={nodeById[linking.from].y + nodeH(nodeById[linking.from]) / 2}
              x2={linking.x} y2={linking.y}
              stroke={colorVar(nodeById[linking.from].color)} strokeWidth={2.5} strokeDasharray="7 6" strokeOpacity={0.8} />
          )}
        </svg>

        {data.nodes.map(n => {
          const isSel = selected === n.id;
          const Icon = KINDS.find(k => k.key === (n.kind ?? 'ideia'))?.icon ?? Lightbulb;
          const c = colorVar(n.color);
          return (
            <div
              key={n.id}
              onPointerDown={e => onNodePointerDown(e, n)}
              onPointerUp={() => finishLinkOn(n.id)}
              onClick={e => e.stopPropagation()}
              onDoubleClick={e => { e.stopPropagation(); setEditing(n); }}
              className={`absolute rounded-xl border bg-card/95 backdrop-blur-sm px-3 py-2.5 cursor-grab active:cursor-grabbing transition-[box-shadow,transform] ${
                isSel ? 'z-20 scale-[1.02]' : 'z-10'
              }`}
              style={{
                left: n.x, top: n.y, width: NODE_W, minHeight: nodeH(n),
                borderColor: c,
                boxShadow: isSel ? `0 0 0 2px ${c}, 0 8px 30px ${c}55` : `0 4px 18px ${c}22`,
              }}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: c }} />
                <p className="font-display text-sm font-semibold leading-tight break-words" style={{ color: c }}>{n.title}</p>
              </div>
              {n.text && <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap break-words">{n.text}</p>}

              {/* alça de conexão */}
              <button
                aria-label="Conectar"
                onPointerDown={e => startLink(e, n)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center opacity-80 hover:opacity-100 active:scale-110 transition"
                style={{ borderColor: c }}>
                <Link2 className="w-3 h-3" style={{ color: c }} />
              </button>

              {isSel && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 rounded-full bg-popover border border-border px-1 py-0.5 shadow-lg">
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditing(n); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); duplicateNode(n); }}><Copy className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); removeNode(n.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* estado vazio */}
      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6 pointer-events-none">
          <Network className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm max-w-xs">
            Toque duas vezes na grade (ou em “Bloco”) para criar seu primeiro nó. Arraste a alça <Link2 className="w-3 h-3 inline" /> para ligar dois blocos.
          </p>
        </div>
      )}

      {/* busca */}
      {searchOpen && (
        <div className="absolute top-3 left-3 right-3 md:right-auto md:w-72 z-30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar bloco..." className="pl-9 pr-9 bg-popover/95 backdrop-blur" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1" onClick={() => { setSearchOpen(false); setQuery(''); }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {results.length > 0 && (
            <div className="mt-1 rounded-lg border border-border bg-popover/95 backdrop-blur overflow-hidden">
              {results.map(n => (
                <button key={n.id} onClick={() => { centerOn(n); setSearchOpen(false); setQuery(''); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: colorVar(n.color) }} />
                  <span className="truncate">{n.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* dica de ligação */}
      {linking && (
        <Badge className="absolute bottom-3 left-3 z-30 gap-1"><Link2 className="w-3 h-3" />Solte sobre outro bloco</Badge>
      )}

      {/* minimapa */}
      {minimap && (
        <div className="absolute bottom-3 right-3 z-20 rounded-lg border border-border/70 bg-background/80 backdrop-blur p-1.5 hidden sm:block"
          style={{ width: minimap.w + 12, height: minimap.h + 12 }}
          onPointerDown={e => e.stopPropagation()}>
          <div className="relative w-full h-full">
            {data.nodes.map(n => (
              <div key={n.id} className="absolute rounded-[2px]"
                style={{
                  left: (n.x - minimap.minX) * minimap.k,
                  top: (n.y - minimap.minY) * minimap.k,
                  width: Math.max(3, NODE_W * minimap.k),
                  height: Math.max(2, nodeH(n) * minimap.k),
                  background: colorVar(n.color),
                  opacity: selected === n.id ? 1 : 0.6,
                }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const dialogs = (
    <>
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Editar bloco</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input value={editing.title} placeholder="Título"
                onChange={e => setEditing({ ...editing, title: e.target.value })} />
              <Textarea rows={4} value={editing.text ?? ''} placeholder="Detalhes, pistas, ligações..."
                onChange={e => setEditing({ ...editing, text: e.target.value })} />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Tipo</p>
                <div className="grid grid-cols-3 gap-2">
                  {KINDS.map(k => (
                    <Button key={k.key} type="button" size="sm"
                      variant={(editing.kind ?? 'ideia') === k.key ? 'default' : 'outline'}
                      className="gap-1.5 justify-start"
                      onClick={() => setEditing({ ...editing, kind: k.key })}>
                      <k.icon className="w-3.5 h-3.5" />{k.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Cor</p>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map(c => (
                    <button key={c.key} type="button" aria-label={c.label} title={c.label}
                      onClick={() => setEditing({ ...editing, color: c.key })}
                      className={`w-full aspect-square rounded-full border-2 transition ${editing.color === c.key ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: colorVar(c.key) }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  commit(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === editing.id ? editing : n) }));
                  setEditing(null);
                }}>Salvar</Button>
                <Button variant="destructive" size="icon" onClick={() => { removeNode(editing.id); setEditing(null); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEdge} onOpenChange={o => !o && setEditingEdge(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Conexão</DialogTitle></DialogHeader>
          {editingEdge && (
            <div className="space-y-3">
              <Input value={editingEdge.label ?? ''} placeholder="Rótulo (ex.: aliado de, esconde)"
                onChange={e => setEditingEdge({ ...editingEdge, label: e.target.value })} />
              <div className="flex gap-2">
                {(['solid', 'dashed'] as const).map(s => (
                  <Button key={s} variant={(editingEdge.style ?? 'solid') === s ? 'default' : 'outline'}
                    className="flex-1" onClick={() => setEditingEdge({ ...editingEdge, style: s })}>
                    {s === 'solid' ? 'Contínua' : 'Tracejada'}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm">Inverter direção</span>
                <Switch checked={false} onCheckedChange={() => setEditingEdge({ ...editingEdge, from: editingEdge.to, to: editingEdge.from })} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  commit(prev => ({ ...prev, edges: prev.edges.map(e => e.id === editingEdge.id ? editingEdge : e) }));
                  setEditingEdge(null);
                }}>Salvar</Button>
                <Button variant="destructive" size="icon" onClick={() => {
                  commit(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== editingEdge.id) }));
                  setEditingEdge(null);
                }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mapsOpen} onOpenChange={setMapsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Meus mapas</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className={`flex items-center gap-2 rounded-lg border p-2 ${d.id === activeDoc?.id ? 'border-primary/60 bg-primary/5' : 'border-border'}`}>
                <Input value={d.name} onChange={e => renameMap(d.id, e.target.value)} className="h-9" />
                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" title="Abrir" onClick={() => switchMap(d.id)}>
                  <Network className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" title="Duplicar" onClick={() => duplicateMap(d)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-destructive" title="Apagar" onClick={() => deleteMap(d.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button className="w-full gap-2" onClick={newMap}><Plus className="w-4 h-4" />Criar novo mapa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col p-2 gap-2">
        {mapsBar}
        {toolbar}
        {canvas}
        {dialogs}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-hist={histTick}>
      <div>
        <h1 className="page-title flex items-center gap-2"><Network className="w-7 h-7" />Mapa Mental</h1>
        <p className="text-sm text-muted-foreground">Conecte ideias, NPCs e tramas numa grade infinita</p>
      </div>
      {mapsBar}
      {toolbar}
      {canvas}
      <p className="text-xs text-muted-foreground">
        Toque duplo cria bloco · arraste a alça para ligar · pinça ou roda para zoom · clique na linha para rotular · Del apaga
      </p>
      {dialogs}
    </div>
  );
};

export default MindMap;
