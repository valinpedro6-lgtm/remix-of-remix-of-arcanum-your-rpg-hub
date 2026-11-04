import { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dices, Trash2, Sparkles } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';

const DICE_TYPES = [2, 4, 6, 8, 10, 12, 20, 100, 1000];

interface RollResult {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: number;
  sides: number;
}

const QUICK_DICE = [4, 6, 8, 10, 12, 20];

// Returns RPG-style label and color based on roll quality
function getRollQuality(rolls: number[], sides: number, total: number, modifier: number): { label: string; color: string; emoji: string } | null {
  if (rolls.length === 0) return null;

  // For single d20, use classic RPG terms
  if (rolls.length === 1 && sides === 20) {
    const val = rolls[0];
    if (val === 20) return { label: 'Acerto Crítico!', color: 'text-yellow-400', emoji: '⚔️' };
    if (val >= 15) return { label: 'Ótimo!', color: 'text-green-400', emoji: '✨' };
    if (val >= 10) return { label: 'Bom', color: 'text-blue-400', emoji: '👍' };
    if (val >= 5) return { label: 'Regular', color: 'text-orange-400', emoji: '😐' };
    if (val >= 2) return { label: 'Péssimo', color: 'text-red-400', emoji: '💀' };
    if (val === 1) return { label: 'Falha Crítica!', color: 'text-red-500', emoji: '💀' };
  }

  // For any other die, use percentage-based quality
  const rawTotal = total - modifier;
  const maxPossible = rolls.length * sides;
  const minPossible = rolls.length;
  const range = maxPossible - minPossible;
  if (range === 0) return null;
  const percent = (rawTotal - minPossible) / range;

  if (percent >= 0.95) return { label: 'Acerto Crítico!', color: 'text-yellow-400', emoji: '⚔️' };
  if (percent >= 0.75) return { label: 'Ótimo!', color: 'text-green-400', emoji: '✨' };
  if (percent >= 0.50) return { label: 'Bom', color: 'text-blue-400', emoji: '👍' };
  if (percent >= 0.25) return { label: 'Regular', color: 'text-orange-400', emoji: '😐' };
  if (percent >= 0.05) return { label: 'Péssimo', color: 'text-red-400', emoji: '💀' };
  return { label: 'Falha Crítica!', color: 'text-red-500', emoji: '💀' };
}

// SVG dice face component
const DiceFace = ({ value, isRolling }: { value: number; isRolling: boolean }) => (
  <motion.div
    className="relative"
    animate={isRolling ? {
      rotateX: [0, 360, 720, 1080],
      rotateY: [0, 180, 360, 540],
      rotateZ: [0, 90, 180, 270],
    } : { rotateX: 0, rotateY: 0, rotateZ: 0 }}
    transition={isRolling ? {
      duration: 0.75,
      repeat: Infinity,
      ease: 'linear',
    } : { type: 'spring', stiffness: 200, damping: 15 }}
    style={{ perspective: 600 }}
  >
    <svg viewBox="0 0 100 100" className="w-28 h-28 drop-shadow-2xl" style={{ filter: isRolling ? 'blur(1px)' : 'none' }}>
      <defs>
        <linearGradient id="diceFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="15" ry="15"
        fill="url(#diceFill)" stroke="hsl(var(--primary))" strokeWidth="2.5" />
      <text x="50" y="58" textAnchor="middle" dominantBaseline="middle"
        fill="hsl(var(--primary))" fontSize={value > 999 ? '18' : value > 99 ? '24' : '32'}
        fontWeight="bold" fontFamily="var(--font-display, serif)">
        {isRolling ? '?' : value}
      </text>
    </svg>
  </motion.div>
);

const DiceRoller = () => {
  const [diceType, setDiceType] = useState('20');
  const [customDice, setCustomDice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [lastRolls, setLastRolls] = useState<number[]>([]);
  const [lastSides, setLastSides] = useState(20);
  const [history, setHistory] = useLocalStorage<RollResult[]>('arcanum-dice-history', []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDiceSides = useCallback(() => {
    if (diceType === 'custom') return Math.max(2, parseInt(customDice) || 6);
    return parseInt(diceType);
  }, [diceType, customDice]);

  const rollDice = useCallback((overrideSides?: number, overrideQty?: number) => {
    const sides = overrideSides || getDiceSides();
    const qty = overrideQty || quantity;
    if (sides < 2) return;
    setIsRolling(true);
    setLastRolls([]);
    setLastSides(sides);
    let count = 0;

    intervalRef.current = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * sides) + 1);
      count++;
      if (count >= 15) {
        clearInterval(intervalRef.current!);
        const rolls = Array.from({ length: qty }, () =>
          Math.floor(Math.random() * sides) + 1
        );
        const total = rolls.reduce((a, b) => a + b, 0) + modifier;
        setDisplayValue(total);
        setLastRolls(rolls);
        setIsRolling(false);
        setHistory(prev => [{
          dice: `${qty}d${sides}${modifier >= 0 ? '+' : ''}${modifier !== 0 ? modifier : ''}`,
          rolls, modifier, total, timestamp: Date.now(), sides,
        }, ...prev.slice(0, 49)]);
      }
    }, 50);
  }, [getDiceSides, quantity, modifier, setHistory]);

  const quickRoll = (sides: number) => {
    rollDice(sides, quantity);
  };

  const formulaText = `${quantity}d${getDiceSides()}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;

  const isNat20 = lastRolls.length === 1 && lastRolls[0] === 20 && lastSides === 20;
  const isNat1 = lastRolls.length === 1 && lastRolls[0] === 1 && lastSides === 20;
  const quality = !isRolling && displayValue !== null ? getRollQuality(lastRolls, lastSides, displayValue, modifier) : null;

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
        Rolagem de Dados
      </motion.h1>

      {/* Quick Roll Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {QUICK_DICE.map(d => (
          <Button
            key={d}
            variant="outline"
            size="sm"
            onClick={() => quickRoll(d)}
            disabled={isRolling}
            className="gap-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Dices className="w-3.5 h-3.5" />D{d}
          </Button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="card-hover glow-border">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Tipo de Dado</label>
                  <Select value={diceType} onValueChange={setDiceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DICE_TYPES.map(d => (
                        <SelectItem key={d} value={String(d)}>D{d}</SelectItem>
                      ))}
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {diceType === 'custom' && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Nº de Lados</label>
                    <NumberInput min={2} value={parseInt(customDice) || 6} onChange={v => setCustomDice(String(v))} placeholder="Ex: 20000" />
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Quantidade</label>
                  <NumberInput min={1} value={quantity} onChange={v => setQuantity(Math.min(100, v))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Modificador</label>
                  <NumberInput value={modifier} onChange={setModifier} />
                </div>
              </div>

              <div className="flex flex-col items-center py-8 relative">
                {/* Quality label */}
                <AnimatePresence mode="wait">
                  {quality && !isRolling && (
                    <motion.div
                      key={quality.label}
                      initial={{ opacity: 0, scale: 0, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2"
                    >
                      <Badge className={`gap-1 ${
                        isNat20 ? 'bg-primary/20 text-primary border-primary/50 animate-pulse' :
                        isNat1 ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse' :
                        'bg-secondary border-border'
                      }`}>
                        <span>{quality.emoji}</span>
                        <span className={quality.color}>{quality.label}</span>
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Animated dice */}
                <div className="my-4">
                  {displayValue !== null || isRolling ? (
                    <DiceFace value={displayValue ?? 0} isRolling={isRolling} />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <DiceFace value={0} isRolling={false} />
                    </motion.div>
                  )}
                </div>

                {!isRolling && displayValue !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-5xl font-display font-bold ${
                      isNat20 ? 'text-primary dice-glow' : isNat1 ? 'text-destructive' : 'text-primary dice-glow'
                    }`}
                  >
                    {displayValue}
                  </motion.div>
                )}

                <p className="text-muted-foreground mt-3 text-lg font-semibold">{formulaText}</p>

                {/* Individual rolls display */}
                {lastRolls.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-1.5 mt-3 justify-center"
                  >
                    {lastRolls.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">
                        {r}
                      </Badge>
                    ))}
                    {modifier !== 0 && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {modifier > 0 ? `+${modifier}` : modifier}
                      </Badge>
                    )}
                  </motion.div>
                )}
              </div>

              <Button onClick={() => rollDice()} disabled={isRolling} className="w-full gap-2" size="lg">
                <Dices className="w-5 h-5" />
                {isRolling ? 'Rolando...' : 'Rolar Dados'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Histórico</h3>
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {history.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhuma rolagem ainda</p>}
                <AnimatePresence initial={false}>
                  {history.map((r, i) => {
                    const q = getRollQuality(r.rolls, r.sides || 20, r.total, r.modifier);
                    return (
                      <motion.div
                        key={r.timestamp + '-' + i}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{r.dice}</span>
                          <span className="text-xs text-muted-foreground">[{r.rolls.join(', ')}]</span>
                          {q && <span className={`text-xs font-semibold ${q.color}`}>{q.emoji} {q.label}</span>}
                        </div>
                        <span className="text-xl font-display font-bold text-primary">{r.total}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DiceRoller;
