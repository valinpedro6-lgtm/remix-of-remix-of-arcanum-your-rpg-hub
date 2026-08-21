import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Trash2, Link2, Unlink, ZoomIn, ZoomOut, Crosshair, Pencil, Network, Download, Upload,
  Maximize2, Minimize2, Image as ImageIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MapNode {
  id: string;
  x: number;
  y: number;
  title: string;
  text?: string;
  color: string;
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

const COLORS = [
  { key: 'primary', label: 'Primária', dot: 'hsl(var(--primary))' },
  { key: 'gold', label: 'Ouro', dot: 'hsl(var(--gold))' },
  { key: 'ember', label: 'Brasa', dot: 'hsl(var(--ember))' },
  { key: 'muted', label: 'Neutra', dot: 'hsl(var(--muted-foreground))' },
];

const colorVar = (key: string) =>
  key === 'gold' ? 'hsl(var(--gold))'
  : key === 'ember' ? 'hsl(var(--ember))'
  : key === 'muted' ? 'hsl(var(--muted-foreground))'
  : 'hsl(var(--primary))';

const NODE_W = 168;
const NODE_H = 84;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Resolve uma cor CSS (com var()) para rgb concreto — necessário no export em canvas. */
const resolveColor = (css: string) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const out = getComputedStyle(probe).color || '#ffffff';
  probe.remove();
  return out;
};

/** Ponto de saída/entrada na borda do bloco, na direção do outro bloco. */
const anchor = (a: MapNode, b: MapNode) => {
  const cx = a.x + NODE_W / 2, cy = a.y + NODE_H / 2;
  const dx = (b.x + NODE_W / 2) - cx, dy = (b.y + NODE_H / 2) - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = Math.abs(dx) > 0 ? (NODE_W / 2) / Math.abs(dx) : Infinity;
  const sy = Math.abs(dy) > 0 ? (NODE_H / 2) / Math.abs(dy) : Infinity;
  const t = Math.min(sx, sy);
  return { x: cx + dx * t, y: cy + dy * t };
};

const MindMap = () => {
  const [data, setData] = useLocalStorage<MindMapData>('arcanum-mindmap', { nodes: [], edges: [] });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [editing, setEditing] = useState<MapNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<MapEdge | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const stateRef = useRef({ scale, pan });
  stateRef.current = { scale, pan };

  const nodeById = useMemo(() => Object.fromEntries(data.nodes.map(n => [n.id, n])), [data.nodes]);

  /** Zoom ancorado num ponto da viewport. */
  const zoomAt = useCallback((next: number, px: number, py: number) => {
    const { scale: z, pan: p } = stateRef.current;
    const clamped = clamp(next, MIN_ZOOM, MAX_ZOOM);
    const k = clamped / z;
    setPan({ x: px - (px - p.x) * k, y: py - (py - p.y) * k });
    setScale(clamped);
  }, []);

  const zoomButton = useCallback((factor: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    zoomAt(stateRef.current.scale * factor, (rect?.width ?? 400) / 2, (rect?.height ?? 400) / 2);
  }, [zoomAt]);

  // Wheel / pinch em listener não-passivo
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAt(stateRef.current.scale * Math.exp(-dy * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt, fullscreen]);

  // ESC sai da tela cheia
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [fullscreen]);

  const addNode = () => {
    const rect = wrapRef.current?.getBoundingClientRect();
    const cx = ((rect ? rect.width / 2 : 200) - pan.x) / scale - NODE_W / 2;
    const cy = ((rect ? rect.height / 2 : 200) - pan.y) / scale - NODE_H / 2;
    const node: MapNode = {
      id: uid(),
      x: Math.round(cx + (Math.random() * 60 - 30)),
      y: Math.round(cy + (Math.random() * 60 - 30)),
      title: 'Nova ideia',
      text: '',
      color: 'primary',
    };
    setData(prev => ({ ...prev, nodes: [...prev.nodes, node] }));
    setSelected(node.id);
  };

  const removeNode = (id: string) => {
    setData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.from !== id && e.to !== id),
    }));
    setSelected(null);
  };

  const handleLink = (id: string) => {
    if (!linkFrom) { setLinkFrom(id); return; }
    if (linkFrom === id) { setLinkFrom(null); return; }
    setData(prev => {
      const exists = prev.edges.some(e =>
        (e.from === linkFrom && e.to === id) || (e.from === id && e.to === linkFrom));
      if (exists) {
        return { ...prev, edges: prev.edges.filter(e =>
          !((e.from === linkFrom && e.to === id) || (e.from === id && e.to === linkFrom))) };
      }
      return { ...prev, edges: [...prev.edges, { id: uid(), from: linkFrom, to: id, style: 'solid' }] };
    });
    setLinkFrom(null);
  };

  // ── drag de nó ──
  const onNodePointerDown = (e: React.PointerEvent, node: MapNode) => {
    if (linkFrom) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { id: node.id, dx: e.clientX / scale - node.x, dy: e.clientY / scale - node.y };
    setSelected(node.id);
  };
  const onNodePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.round(e.clientX / scale - d.dx);
    const y = Math.round(e.clientY / scale - d.dy);
    setData(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === d.id ? { ...n, x, y } : n) }));
  };
  const endDrag = () => { drag.current = null; };

  // ── pan do canvas ──
  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (drag.current) return;
    panRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
    setSelected(null);
  };
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect && linkFrom) setPointer({ x: (e.clientX - rect.left - pan.x) / scale, y: (e.clientY - rect.top - pan.y) / scale });
    const p = panRef.current;
    if (!p || drag.current) return;
    setPan({ x: p.x + (e.clientX - p.px), y: p.y + (e.clientY - p.py) });
  };
  const endPan = () => { panRef.current = null; };

  const reset = () => {
    if (!data.nodes.length) { setScale(1); setPan({ x: 0, y: 0 }); return; }
    const rect = wrapRef.current?.getBoundingClientRect();
    const minX = Math.min(...data.nodes.map(n => n.x));
    const minY = Math.min(...data.nodes.map(n => n.y));
    const maxX = Math.max(...data.nodes.map(n => n.x + NODE_W));
    const maxY = Math.max(...data.nodes.map(n => n.y + NODE_H));
    const w = rect?.width ?? 600, h = rect?.height ?? 600;
    const z = clamp(Math.min((w - 60) / (maxX - minX), (h - 60) / (maxY - minY)), MIN_ZOOM, 1.2);
    setScale(z);
    setPan({ x: w / 2 - ((minX + maxX) / 2) * z, y: h / 2 - ((minY + maxY) / 2) * z });
  };

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
        setData({ nodes: parsed.nodes, edges: parsed.edges ?? [] });
        toast({ title: 'Mapa importado!' });
      } catch {
        toast({ title: 'Arquivo inválido', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  // ── export PNG (desenho direto em canvas) ──
  const exportPng = () => {
    if (!data.nodes.length) { toast({ title: 'Mapa vazio' }); return; }
    const pad = 80;
    const minX = Math.min(...data.nodes.map(n => n.x)) - pad;
    const minY = Math.min(...data.nodes.map(n => n.y)) - pad;
    const maxX = Math.max(...data.nodes.map(n => n.x + NODE_W)) + pad;
    const maxY = Math.max(...data.nodes.map(n => n.y + NODE_H)) + pad;
    const w = maxX - minX, h = maxY - minY;
    const dpr = 2;
    const canvas = document.createElement('canvas');
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.translate(-minX, -minY);

    const bg = resolveColor('hsl(var(--background))');
    const gridC = resolveColor('hsl(var(--border))');
    const mutedC = resolveColor('hsl(var(--muted-foreground))');
    const cardC = resolveColor('hsl(var(--card))');

    ctx.fillStyle = bg;
    ctx.fillRect(minX, minY, w, h);

    // grade
    ctx.strokeStyle = gridC; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
    for (let x = Math.floor(minX / 24) * 24; x < maxX; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, maxY); ctx.stroke();
    }
    for (let y = Math.floor(minY / 24) * 24; y < maxY; y += 24) {
      ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // conexões
    data.edges.forEach(e => {
      const a = nodeById[e.from], b = nodeById[e.to];
      if (!a || !b) return;
      const p1 = anchor(a, b), p2 = anchor(b, a);
      const mx = (p1.x + p2.x) / 2;
      ctx.strokeStyle = resolveColor(colorVar(a.color));
      ctx.lineWidth = 2.5;
      ctx.setLineDash(e.style === 'dashed' ? [8, 6] : []);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(mx, p1.y, mx, p2.y, p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // seta
      const ang = Math.atan2(p2.y - p1.y, p2.x - mx);
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - 10 * Math.cos(ang - 0.4), p2.y - 10 * Math.sin(ang - 0.4));
      ctx.lineTo(p2.x - 10 * Math.cos(ang + 0.4), p2.y - 10 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
      if (e.label) {
        ctx.font = '600 12px Rajdhani, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lx = (p1.x + p2.x) / 2, ly = (p1.y + p2.y) / 2;
        const tw = ctx.measureText(e.label).width + 10;
        ctx.fillStyle = bg;
        ctx.fillRect(lx - tw / 2, ly - 9, tw, 18);
        ctx.fillStyle = mutedC;
        ctx.fillText(e.label, lx, ly);
      }
    });

    // blocos
    data.nodes.forEach(n => {
      const c = resolveColor(colorVar(n.color));
      ctx.fillStyle = cardC;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      const r = 12;
      ctx.beginPath();
      ctx.roundRect(n.x, n.y, NODE_W, NODE_H, r);
      ctx.fill(); ctx.stroke();

      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = c;
      ctx.font = '700 14px Cinzel, serif';
      ctx.fillText(n.title.slice(0, 22), n.x + 12, n.y + 12);

      if (n.text) {
        ctx.fillStyle = mutedC;
        ctx.font = '400 12px Rajdhani, sans-serif';
        const words = n.text.split(/\s+/);
        let line = '', ly = n.y + 34, lines = 0;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > NODE_W - 24) {
            ctx.fillText(line, n.x + 12, ly);
            line = word; ly += 15; lines++;
            if (lines >= 3) { line = ''; break; }
          } else line = test;
        }
        if (line) ctx.fillText(line, n.x + 12, ly);
      }
    });

    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'arcanum-mapa-mental.png';
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: 'Imagem exportada!' });
    }, 'image/png');
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={addNode} className="gap-2"><Plus className="w-4 h-4" />Bloco</Button>
      <Button variant="outline" size="icon" title="Diminuir" onClick={() => zoomButton(1 / 1.2)}><ZoomOut className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" title="Aumentar" onClick={() => zoomButton(1.2)}><ZoomIn className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" title="Enquadrar tudo" onClick={reset}><Crosshair className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" title="Exportar PNG" onClick={exportPng}><ImageIcon className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" title="Exportar JSON" onClick={exportJson}><Download className="w-4 h-4" /></Button>
      <label>
        <input type="file" accept="application/json" className="hidden"
          onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} />
        <Button variant="outline" size="icon" title="Importar JSON" asChild><span><Upload className="w-4 h-4" /></span></Button>
      </label>
      <Button variant="outline" size="icon" title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        onClick={() => setFullscreen(f => !f)}>
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>
      <Badge variant="outline" className="ml-auto tabular-nums">{Math.round(scale * 100)}%</Badge>
    </div>
  );

  const canvas = (
    <div
      ref={wrapRef}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={e => { onCanvasPointerMove(e); onNodePointerMove(e); }}
      onPointerUp={() => { endPan(); endDrag(); }}
      onPointerLeave={() => { endPan(); endDrag(); }}
      className={`relative w-full overflow-hidden rounded-xl glass-card glow-border touch-none select-none ${
        fullscreen ? 'flex-1 rounded-none border-0' : 'h-[65dvh] md:h-[72dvh]'
      }`}
      style={{
        backgroundImage:
          'linear-gradient(hsl(var(--border)/0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.5) 1px, transparent 1px)',
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        <svg className="absolute overflow-visible" style={{ width: 1, height: 1 }}>
          <defs>
            {COLORS.map(c => (
              <marker key={c.key} id={`arrow-${c.key}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={colorVar(c.key)} />
              </marker>
            ))}
          </defs>
          {data.edges.map(e => {
            const a = nodeById[e.from]; const b = nodeById[e.to];
            if (!a || !b) return null;
            const p1 = anchor(a, b), p2 = anchor(b, a);
            const mx = (p1.x + p2.x) / 2;
            const d = `M ${p1.x} ${p1.y} C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`;
            return (
              <g key={e.id} className="cursor-pointer"
                onPointerDown={ev => ev.stopPropagation()}
                onClick={ev => { ev.stopPropagation(); setEditingEdge(e); }}>
                <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
                <path
                  d={d}
                  fill="none"
                  stroke={colorVar(a.color)}
                  strokeOpacity={0.75}
                  strokeWidth={2.5}
                  strokeDasharray={e.style === 'dashed' ? '8 6' : undefined}
                  markerEnd={`url(#arrow-${a.color})`}
                />
                {e.label && (
                  <text
                    x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    className="fill-muted-foreground text-[11px] font-medium"
                    style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 5 }}
                  >{e.label}</text>
                )}
              </g>
            );
          })}
          {linkFrom && pointer && nodeById[linkFrom] && (
            <line
              x1={nodeById[linkFrom].x + NODE_W / 2} y1={nodeById[linkFrom].y + NODE_H / 2}
              x2={pointer.x} y2={pointer.y}
              stroke={colorVar(nodeById[linkFrom].color)} strokeWidth={2} strokeDasharray="6 6" strokeOpacity={0.6}
            />
          )}
        </svg>

        {data.nodes.map(n => {
          const isSel = selected === n.id;
          const isLink = linkFrom === n.id;
          return (
            <div
              key={n.id}
              onPointerDown={e => onNodePointerDown(e, n)}
              onClick={e => { e.stopPropagation(); if (linkFrom) handleLink(n.id); }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(n); }}
              className={`absolute rounded-xl border bg-card/90 backdrop-blur-sm p-3 shadow-lg cursor-grab active:cursor-grabbing transition-shadow ${
                isLink ? 'ring-2 ring-primary' : isSel ? 'ring-1 ring-primary/60' : ''
              }`}
              style={{
                left: n.x, top: n.y, width: NODE_W, minHeight: NODE_H,
                borderColor: colorVar(n.color),
                boxShadow: `0 0 18px ${colorVar(n.color)}22`,
              }}
            >
              <p className="font-display text-sm font-semibold leading-tight" style={{ color: colorVar(n.color) }}>
                {n.title}
              </p>
              {n.text && <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{n.text}</p>}
              {isSel && (
                <div className="absolute -top-3 right-1 flex gap-1">
                  <Button size="icon" variant="secondary" className="h-6 w-6"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditing(n); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-6 w-6"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); handleLink(n.id); }}>
                    {linkFrom ? <Unlink className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                  </Button>
                  <Button size="icon" variant="destructive" className="h-6 w-6"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); removeNode(n.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 pointer-events-none">
          <Network className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Toque em “Bloco” para começar seu mapa</p>
        </div>
      )}

      {linkFrom && (
        <Badge className="absolute top-3 left-3 gap-1"><Link2 className="w-3 h-3" />Escolha o segundo bloco</Badge>
      )}
    </div>
  );

  const dialogs = (
    <>
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Editar bloco</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input value={editing.title} placeholder="Título"
                onChange={e => setEditing({ ...editing, title: e.target.value })} />
              <Textarea rows={4} value={editing.text ?? ''} placeholder="Detalhes, pistas, ligações..."
                onChange={e => setEditing({ ...editing, text: e.target.value })} />
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c.key} type="button" aria-label={c.label}
                    onClick={() => setEditing({ ...editing, color: c.key })}
                    className={`w-8 h-8 rounded-full border-2 ${editing.color === c.key ? 'border-foreground' : 'border-transparent'}`}
                    style={{ background: c.dot }} />
                ))}
              </div>
              <Button className="w-full" onClick={() => {
                setData(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === editing.id ? editing : n) }));
                setEditing(null);
              }}>Salvar</Button>
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
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  setData(prev => ({ ...prev, edges: prev.edges.map(e => e.id === editingEdge.id ? editingEdge : e) }));
                  setEditingEdge(null);
                }}>Salvar</Button>
                <Button variant="destructive" size="icon" onClick={() => {
                  setData(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== editingEdge.id) }));
                  setEditingEdge(null);
                }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col p-3 gap-3">
        {toolbar}
        {canvas}
        {dialogs}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title flex items-center gap-2"><Network className="w-7 h-7" />Mapa Mental</h1>
        <p className="text-sm text-muted-foreground">Conecte ideias, NPCs e tramas em uma grade livre</p>
      </div>
      {toolbar}
      {canvas}
      <p className="text-xs text-muted-foreground">
        Arraste o fundo para mover · role/pince para zoom · toque duplo no bloco para editar · clique na linha para rotular ou excluir
      </p>
      {dialogs}
    </div>
  );
};

export default MindMap;
