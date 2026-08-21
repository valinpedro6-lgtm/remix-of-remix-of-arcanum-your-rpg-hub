import { useRef, useState, useCallback, useMemo } from 'react';
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

const uid = () => Math.random().toString(36).slice(2, 10);

const MindMap = () => {
  const [data, setData] = useLocalStorage<MindMapData>('arcanum-mindmap', { nodes: [], edges: [] });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [editing, setEditing] = useState<MapNode | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const nodeById = useMemo(() => Object.fromEntries(data.nodes.map(n => [n.id, n])), [data.nodes]);

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
      return { ...prev, edges: [...prev.edges, { id: uid(), from: linkFrom, to: id }] };
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
    const p = panRef.current;
    if (!p || drag.current) return;
    setPan({ x: p.x + (e.clientX - p.px), y: p.y + (e.clientY - p.py) });
  };
  const endPan = () => { panRef.current = null; };

  const zoom = useCallback((delta: number) => {
    setScale(s => Math.min(2, Math.max(0.4, +(s + delta).toFixed(2))));
  }, []);

  const reset = () => { setScale(1); setPan({ x: 0, y: 0 }); };

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="page-title flex items-center gap-2"><Network className="w-7 h-7" />Mapa Mental</h1>
          <p className="text-sm text-muted-foreground">Conecte ideias, NPCs e tramas em uma grade livre</p>
        </div>
        <Button onClick={addNode} className="gap-2"><Plus className="w-4 h-4" />Bloco</Button>
        <Button variant="outline" size="icon" onClick={() => zoom(-0.1)}><ZoomOut className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => zoom(0.1)}><ZoomIn className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={reset}><Crosshair className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={exportJson}><Download className="w-4 h-4" /></Button>
        <label>
          <input type="file" accept="application/json" className="hidden"
            onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} />
          <Button variant="outline" size="icon" asChild><span><Upload className="w-4 h-4" /></span></Button>
        </label>
      </div>

      {linkFrom && (
        <Badge className="gap-1"><Link2 className="w-3 h-3" />Selecione o segundo bloco para ligar/desligar</Badge>
      )}

      <div
        ref={wrapRef}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={e => { onCanvasPointerMove(e); onNodePointerMove(e); }}
        onPointerUp={() => { endPan(); endDrag(); }}
        onPointerLeave={() => { endPan(); endDrag(); }}
        className="relative w-full h-[65dvh] md:h-[72dvh] overflow-hidden rounded-xl glass-card glow-border touch-none select-none"
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
          <svg className="absolute overflow-visible pointer-events-none" style={{ width: 1, height: 1 }}>
            {data.edges.map(e => {
              const a = nodeById[e.from]; const b = nodeById[e.to];
              if (!a || !b) return null;
              const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H / 2;
              const x2 = b.x + NODE_W / 2, y2 = b.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              return (
                <path key={e.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={colorVar(a.color)}
                  strokeOpacity={0.55}
                  strokeWidth={2}
                />
              );
            })}
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
      </div>

      <p className="text-xs text-muted-foreground">
        Arraste o fundo para mover a grade · arraste blocos para reposicionar · toque duplo para editar
      </p>

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
    </div>
  );
};

export default MindMap;
