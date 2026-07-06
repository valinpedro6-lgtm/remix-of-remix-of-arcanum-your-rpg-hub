import { Heart, Minus, Plus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HPBarProps {
  hp: number;
  maxHp: number;
  tempHp?: number;
  onHpChange: (val: number) => void;
  onTempHpChange?: (val: number) => void;
  compact?: boolean;
}

/**
 * Rich HP display: gradient progress bar + quick ±1/±5 damage/heal + temp HP.
 * Color shifts from primary/red to warning to green based on ratio.
 */
export const HPBar = ({ hp, maxHp, tempHp = 0, onHpChange, onTempHpChange, compact }: HPBarProps) => {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const pct = Math.round(ratio * 100);

  const barColor = ratio > 0.6
    ? 'from-emerald-500 to-emerald-400'
    : ratio > 0.3
      ? 'from-amber-500 to-yellow-400'
      : 'from-red-600 to-red-500';

  const glow = ratio <= 0.25 && hp > 0
    ? 'shadow-[0_0_18px_rgba(239,68,68,0.5)] animate-pulse'
    : ratio === 0
      ? 'grayscale opacity-70'
      : '';

  const clamp = (n: number) => Math.max(0, Math.min(maxHp + tempHp, n));

  return (
    <div className={cn('rounded-lg bg-secondary/40 border border-border/50 p-2 space-y-1.5', glow)}>
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-red-400 shrink-0" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onHpChange(clamp(hp - 5)); }}
            className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
            title="-5"
          >-5</button>
          <button
            onClick={(e) => { e.stopPropagation(); onHpChange(clamp(hp - 1)); }}
            className="p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          ><Minus className="w-3 h-3" /></button>
        </div>
        <span className="text-sm font-bold tabular-nums flex-1 text-center">
          <span className={ratio <= 0.3 ? 'text-red-400' : ratio <= 0.6 ? 'text-amber-300' : 'text-foreground'}>{hp}</span>
          <span className="text-muted-foreground text-xs mx-0.5">/</span>
          <span className="text-muted-foreground text-xs">{maxHp}</span>
          {tempHp > 0 && (
            <span className="ml-1 text-[10px] text-cyan-400 font-semibold">+{tempHp}</span>
          )}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onHpChange(clamp(hp + 1)); }}
            className="p-0.5 rounded hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 transition-colors"
          ><Plus className="w-3 h-3" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); onHpChange(clamp(hp + 5)); }}
            className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 transition-colors"
            title="+5"
          >+5</button>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
        {tempHp > 0 && (
          <div
            className="absolute inset-y-0 bg-cyan-400/60 border-l border-cyan-200"
            style={{ left: `${pct}%`, width: `${Math.min(100 - pct, (tempHp / maxHp) * 100)}%` }}
          />
        )}
      </div>
      {!compact && onTempHpChange && (
        <div className="flex items-center gap-1 pt-0.5">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] text-muted-foreground">HP Temp</span>
          <button onClick={(e) => { e.stopPropagation(); onTempHpChange(Math.max(0, tempHp - 1)); }} className="p-0.5 hover:text-cyan-400"><Minus className="w-2.5 h-2.5" /></button>
          <span className="text-xs font-semibold text-cyan-400 min-w-[1.5ch] text-center">{tempHp}</span>
          <button onClick={(e) => { e.stopPropagation(); onTempHpChange(tempHp + 1); }} className="p-0.5 hover:text-cyan-400"><Plus className="w-2.5 h-2.5" /></button>
        </div>
      )}
    </div>
  );
};
