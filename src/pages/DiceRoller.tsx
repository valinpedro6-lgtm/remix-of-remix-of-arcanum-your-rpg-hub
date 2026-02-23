import { useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dices, Trash2 } from 'lucide-react';

const DICE_TYPES = [2, 4, 6, 8, 10, 12, 20, 100, 1000];

interface RollResult {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: number;
}

const DiceRoller = () => {
  const [diceType, setDiceType] = useState('20');
  const [customDice, setCustomDice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [history, setHistory] = useLocalStorage<RollResult[]>('arcanum-dice-history', []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDiceSides = useCallback(() => {
    if (diceType === 'custom') return Math.max(2, parseInt(customDice) || 6);
    return parseInt(diceType);
  }, [diceType, customDice]);

  const rollDice = useCallback(() => {
    const sides = getDiceSides();
    if (sides < 2) return;
    setIsRolling(true);
    let count = 0;

    intervalRef.current = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * sides) + 1);
      count++;
      if (count >= 20) {
        clearInterval(intervalRef.current!);
        const rolls = Array.from({ length: quantity }, () =>
          Math.floor(Math.random() * sides) + 1
        );
        const total = rolls.reduce((a, b) => a + b, 0) + modifier;
        setDisplayValue(total);
        setIsRolling(false);
        setHistory(prev => [{
          dice: `${quantity}d${sides}${modifier >= 0 ? '+' : ''}${modifier !== 0 ? modifier : ''}`,
          rolls, modifier, total, timestamp: Date.now(),
        }, ...prev.slice(0, 49)]);
      }
    }, 50);
  }, [getDiceSides, quantity, modifier, setHistory]);

  const formulaText = `${quantity}d${getDiceSides()}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Rolagem de Dados</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
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
                  <Input type="number" min={2} value={customDice} onChange={e => setCustomDice(e.target.value)} placeholder="Ex: 20000" />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Quantidade</label>
                <Input type="number" min={1} max={100} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Modificador</label>
                <Input type="number" value={modifier} onChange={e => setModifier(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="flex flex-col items-center py-10">
              <div className={`text-7xl font-display font-bold transition-all duration-200 ${isRolling ? 'animate-dice-shake text-primary dice-glow' : 'text-primary'}`}>
                {displayValue !== null ? displayValue : '?'}
              </div>
              <p className="text-muted-foreground mt-3 text-lg">{formulaText}</p>
            </div>

            <Button onClick={rollDice} disabled={isRolling} className="w-full" size="lg">
              <Dices className="w-5 h-5 mr-2" />
              {isRolling ? 'Rolando...' : 'Rolar Dados'}
            </Button>
          </CardContent>
        </Card>

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
              {history.map((r, i) => (
                <div key={r.timestamp + '-' + i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <span className="font-semibold">{r.dice}</span>
                    <span className="text-sm text-muted-foreground ml-2">[{r.rolls.join(', ')}]</span>
                  </div>
                  <span className="text-xl font-display font-bold text-primary">{r.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiceRoller;
