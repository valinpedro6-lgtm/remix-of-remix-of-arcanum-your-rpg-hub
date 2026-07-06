import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { X, Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export const CONDITION_PRESETS: { name: string; color: string; icon?: string }[] = [
  { name: 'Envenenado', color: 'bg-green-600/80', icon: '☠' },
  { name: 'Atordoado', color: 'bg-yellow-500/80', icon: '★' },
  { name: 'Paralisado', color: 'bg-blue-500/80', icon: '❄' },
  { name: 'Amedrontado', color: 'bg-purple-600/80', icon: '👁' },
  { name: 'Enfeitiçado', color: 'bg-pink-500/80', icon: '✦' },
  { name: 'Cego', color: 'bg-slate-600/80', icon: '⊘' },
  { name: 'Surdo', color: 'bg-slate-500/80', icon: '♪' },
  { name: 'Caído', color: 'bg-orange-600/80', icon: '↓' },
  { name: 'Agarrado', color: 'bg-amber-700/80', icon: '⚓' },
  { name: 'Impedido', color: 'bg-red-700/80', icon: '⛓' },
  { name: 'Incapacitado', color: 'bg-red-800/80', icon: '✕' },
  { name: 'Inconsciente', color: 'bg-slate-800/80', icon: '☾' },
  { name: 'Invisível', color: 'bg-cyan-500/60', icon: '◌' },
  { name: 'Sangrando', color: 'bg-red-600/80', icon: '❦' },
  { name: 'Em Chamas', color: 'bg-orange-500/80', icon: '🔥' },
  { name: 'Congelado', color: 'bg-cyan-600/80', icon: '❆' },
  { name: 'Abençoado', color: 'bg-yellow-400/70', icon: '✧' },
  { name: 'Amaldiçoado', color: 'bg-purple-800/80', icon: '☠' },
  { name: 'Concentrando', color: 'bg-indigo-500/80', icon: '◉' },
  { name: 'Enfurecido', color: 'bg-red-500/80', icon: '⚡' },
];

interface StatusConditionsProps {
  conditions: string[];
  onChange: (next: string[]) => void;
  compact?: boolean;
}

export const StatusConditions = ({ conditions, onChange, compact }: StatusConditionsProps) => {
  const [custom, setCustom] = useState('');

  const toggle = (name: string) => {
    if (conditions.includes(name)) onChange(conditions.filter(c => c !== name));
    else onChange([...conditions, name]);
  };

  const addCustom = () => {
    const t = custom.trim();
    if (!t || conditions.includes(t)) return;
    onChange([...conditions, t]);
    setCustom('');
  };

  const colorOf = (name: string) => CONDITION_PRESETS.find(p => p.name === name)?.color || 'bg-primary/70';
  const iconOf = (name: string) => CONDITION_PRESETS.find(p => p.name === name)?.icon;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {conditions.map(c => (
        <span
          key={c}
          className={`${colorOf(c)} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm`}
        >
          {iconOf(c) && <span>{iconOf(c)}</span>}
          {c}
          <button onClick={(e) => { e.stopPropagation(); toggle(c); }} className="hover:text-red-200 ml-0.5">
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border hover:border-primary hover:text-primary transition-colors ${compact ? '' : ''}`}
          >
            <Plus className="w-2.5 h-2.5" />
            {conditions.length === 0 ? 'Adicionar condição' : ''}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 mb-2 text-xs font-semibold text-muted-foreground">
            <ShieldAlert className="w-3 h-3" /> Condições
          </div>
          <div className="flex flex-wrap gap-1 mb-3 max-h-56 overflow-y-auto">
            {CONDITION_PRESETS.map(p => {
              const active = conditions.includes(p.name);
              return (
                <button
                  key={p.name}
                  onClick={() => toggle(p.name)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-all ${active ? `${p.color} text-white shadow` : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
                >
                  {p.icon} {p.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1">
            <Input
              placeholder="Custom..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              className="h-8 text-xs"
            />
            <Button size="sm" variant="outline" onClick={addCustom} className="h-8"><Plus className="w-3 h-3" /></Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
