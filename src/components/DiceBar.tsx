import { useState } from 'react';
import { Dices } from 'lucide-react';

const DICE = [4, 6, 8, 10, 12, 20, 100];

/** Barra de dados rápida: rola e mostra o último resultado. */
export const DiceBar = ({ dark }: { dark?: boolean }) => {
  const [last, setLast] = useState<{ sides: number; value: number } | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = (sides: number) => {
    setRolling(true);
    let ticks = 0;
    const id = setInterval(() => {
      setLast({ sides, value: 1 + Math.floor(Math.random() * sides) });
      if (++ticks >= 6) { clearInterval(id); setRolling(false); }
    }, 60);
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap rounded-lg border px-2 py-1.5 ${dark ? 'border-white/20 bg-black/60' : 'border-border/60 bg-card/60'}`}>
      <Dices className={`w-4 h-4 ${dark ? 'text-white/70' : 'text-primary'}`} />
      {DICE.map(d => (
        <button
          key={d}
          onClick={() => roll(d)}
          className={`text-xs font-bold px-1.5 py-0.5 rounded transition-colors ${dark ? 'text-white/80 hover:bg-white/10' : 'hover:bg-primary/10 hover:text-primary'}`}
        >
          d{d}
        </button>
      ))}
      {last && (
        <span className={`ml-1 text-sm font-display font-bold tabular-nums ${rolling ? 'opacity-60' : ''} ${dark ? 'text-amber-300' : 'text-primary'}`}>
          d{last.sides}: {last.value}
        </span>
      )}
    </div>
  );
};
