import { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

const QUICK_DICE = [4, 6, 8, 10, 12, 20];

const DiceRoller = () => {
  const [diceType, setDiceType] = useState('20');
  const [customDice, setCustomDice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [lastRolls, setLastRolls] = useState<number[]>([]);
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
          rolls, modifier, total, timestamp: Date.now(),
        }, ...prev.slice(0, 49)]);
      }
    }, 50);
  }, [getDiceSides, quantity, modifier, setHistory]);

  const quickRoll = (sides: number) => {
    rollDice(sides, quantity);
  };

  const formulaText = `${quantity}d${getDiceSides()}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;

  const isNat20 = lastRolls.length === 1 && lastRolls[0] === 20 && getDiceSides() === 20;
  const isNat1 = lastRolls.length === 1 && lastRolls[0] === 1 && getDiceSides() === 20;

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

              <div className="flex flex-col items-center py-10 relative">
                {isNat20 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2"
                  >
                    <Badge className="bg-primary/20 text-primary border-primary/50 gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" />CRÍTICO!
                    </Badge>
                  </motion.div>
                )}
                {isNat1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2"
                  >
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                      💀 FALHA CRÍTICA!
                    </Badge>
                  </motion.div>
                )}
                <motion.div
                  key={displayValue}
                  initial={isRolling ? { scale: 0.8, rotate: -10 } : { scale: 1.3 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={`text-7xl font-display font-bold transition-colors duration-200 ${
                    isRolling ? 'text-primary/60' : isNat20 ? 'text-primary dice-glow' : isNat1 ? 'text-destructive' : 'text-primary dice-glow'
                  }`}
                >
                  {displayValue !== null ? displayValue : '?'}
                </motion.div>
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
                  {history.map((r, i) => (
                    <motion.div
                      key={r.timestamp + '-' + i}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30"
                    >
                      <div>
                        <span className="font-semibold">{r.dice}</span>
                        <span className="text-xs text-muted-foreground ml-2">[{r.rolls.join(', ')}]</span>
                      </div>
                      <span className="text-xl font-display font-bold text-primary">{r.total}</span>
                    </motion.div>
                  ))}
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
