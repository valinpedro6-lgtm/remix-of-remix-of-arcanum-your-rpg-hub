import { useEffect, useRef, useState } from 'react';
import { Dices, Minus, Plus, X } from 'lucide-react';
import { DiceAnimation, Roll } from '@/components/DiceBar';
import { Input } from '@/components/ui/input';

const SIDES = [4, 6, 8, 10, 12, 20, 100];
const POSITION_KEY = 'arcanum-floating-dice-position';
interface Position { x: number; y: number }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const initialPosition = (): Position => {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY) ?? 'null') as Partial<Position> | null;
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return { x: saved.x, y: saved.y };
  } catch { /* posição padrão */ }
  return { x: 16, y: 88 };
};

export const FloatingDice = () => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const [quantity, setQuantity] = useState(1);
  const [sides, setSides] = useState(20);
  const [modifier, setModifier] = useState(0);
  const [roll, setRoll] = useState<Roll | null>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  }, [position]);

  const rollDice = () => {
    const dice = Array.from({ length: quantity }, () => 1 + Math.floor(Math.random() * sides));
    const subtotal = dice.reduce((sum, value) => sum + value, 0);
    const total = subtotal + modifier;
    const sign = modifier >= 0 ? (modifier ? ` + ${modifier}` : '') : ` - ${Math.abs(modifier)}`;
    setRoll({ expr: `${quantity}d${sides}${sign}`, total, by: 'Você', at: Date.now() });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!open || event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: position.x, startY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setPosition({
      x: clamp(current.startX + event.clientX - current.x, 8, window.innerWidth - 72),
      y: clamp(current.startY + event.clientY - current.y, 8, window.innerHeight - 72),
    });
  };
  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  return <>
    <div className="fixed z-[60] select-none" style={{ left: position.x, top: position.y }}>
      {open ? <div className="w-[min(19rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-primary/45 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} className="flex cursor-grab touch-none items-center gap-2 border-b border-border/50 bg-primary/10 px-3 py-2 active:cursor-grabbing">
          <Dices className="h-4 w-4 text-primary" /><span className="flex-1 text-sm font-bold">Rolador rápido</span><span className="text-[10px] text-muted-foreground">arraste</span><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-primary/15 hover:text-foreground" aria-label="Fechar rolador"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-2"><label className="text-xs text-muted-foreground">Quantidade</label><div className="flex items-center gap-1"><button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border/60 hover:border-primary" onClick={() => setQuantity(value => clamp(value - 1, 1, 20))} aria-label="Diminuir quantidade"><Minus className="h-3.5 w-3.5" /></button><Input aria-label="Quantidade de dados" type="number" min={1} max={20} value={quantity} onChange={event => setQuantity(clamp(Number(event.target.value) || 1, 1, 20))} className="h-8 w-14 text-center" /><button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-border/60 hover:border-primary" onClick={() => setQuantity(value => clamp(value + 1, 1, 20))} aria-label="Aumentar quantidade"><Plus className="h-3.5 w-3.5" /></button></div></div>
          <div><p className="mb-1.5 text-xs text-muted-foreground">Tipo de dado</p><div className="grid grid-cols-4 gap-1.5">{SIDES.map(value => <button key={value} type="button" onClick={() => setSides(value)} className={`rounded-md border px-2 py-1.5 text-xs font-bold transition-colors ${sides === value ? 'border-primary bg-primary/15 text-primary' : 'border-border/60 hover:border-primary/60'}`}>d{value}</button>)}</div></div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-2"><label htmlFor="floating-dice-modifier" className="text-xs text-muted-foreground">Modificador</label><Input id="floating-dice-modifier" type="number" min={-50} max={50} value={modifier} onChange={event => setModifier(clamp(Number(event.target.value) || 0, -50, 50))} className="h-8 w-24 text-center" /></div>
          <button type="button" onClick={rollDice} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98]"><Dices className="h-4 w-4" /> Rolar {quantity}d{sides}{modifier ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}</button>
        </div>
      </div> : <button type="button" onClick={() => setOpen(true)} className="grid h-12 w-12 place-items-center rounded-full border border-primary/60 bg-card/95 text-primary shadow-xl shadow-black/40 backdrop-blur-xl transition-transform hover:scale-105" aria-label="Abrir rolador de dados"><Dices className="h-6 w-6" /></button>}
    </div>
    <DiceAnimation roll={roll} />
  </>;
};
