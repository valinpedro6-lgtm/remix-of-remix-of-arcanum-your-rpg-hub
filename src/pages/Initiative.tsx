import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronRight, RotateCcw, Dices, Swords, Heart, Shield, Skull, User } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp?: number;
  maxHp?: number;
  ca?: number;
  conditions?: string[];
  type: 'player' | 'monster';
}

const CONDITION_OPTIONS = ['Atordoado', 'Envenenado', 'Incapacitado', 'Invisível', 'Prone', 'Restringido', 'Amedrontado', 'Agarrado', 'Concentrando'];

const Initiative = () => {
  const [combatants, setCombatants] = useLocalStorage<Combatant[]>('arcanum-initiative', []);
  const [currentTurn, setCurrentTurn] = useLocalStorage<number>('arcanum-initiative-turn', 0);
  const [round, setRound] = useLocalStorage<number>('arcanum-initiative-round', 1);
  const [name, setName] = useState('');
  const [init, setInit] = useState('');
  const [showHp, setShowHp] = useState(false);
  const [combatantType, setCombatantType] = useState<'player' | 'monster'>('player');

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const add = () => {
    if (!name.trim()) return;
    setCombatants(prev => [...prev, {
      id: crypto.randomUUID(),
      name: name.trim(),
      initiative: parseInt(init) || 0,
      hp: 0, maxHp: 0, ca: 10,
      conditions: [],
      type: combatantType,
    }]);
    setName('');
    setInit('');
  };

  const rollInit = () => {
    const rolled = Math.floor(Math.random() * 20) + 1;
    setInit(String(rolled));
  };

  const remove = (id: string) => setCombatants(prev => prev.filter(c => c.id !== id));

  const nextTurn = () => {
    if (sorted.length === 0) return;
    const next = (currentTurn + 1) % sorted.length;
    if (next === 0) setRound(prev => prev + 1);
    setCurrentTurn(next);
  };

  const prevTurn = () => {
    if (sorted.length === 0) return;
    const prev = currentTurn === 0 ? sorted.length - 1 : currentTurn - 1;
    if (currentTurn === 0 && round > 1) setRound(r => r - 1);
    setCurrentTurn(prev);
  };

  const resetCombat = () => { setCombatants([]); setCurrentTurn(0); setRound(1); };

  const updateField = (id: string, field: string, value: any) => {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleCondition = (id: string, cond: string) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const conditions = c.conditions || [];
      return { ...c, conditions: conditions.includes(cond) ? conditions.filter(x => x !== cond) : [...conditions, cond] };
    }));
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
        Iniciativa
      </motion.h1>

      <div className="max-w-lg mx-auto space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="card-hover glow-border">
            <CardContent className="p-4 space-y-3">
              {/* Type selector */}
              <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
                <Button
                  variant={combatantType === 'player' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setCombatantType('player')}
                >
                  <User className="w-3.5 h-3.5" />Jogador
                </Button>
                <Button
                  variant={combatantType === 'monster' ? 'destructive' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setCombatantType('monster')}
                >
                  <Skull className="w-3.5 h-3.5" />Monstro
                </Button>
              </div>

              <div className="flex gap-2">
                <Input placeholder={combatantType === 'monster' ? 'Nome do Monstro' : 'Nome do Jogador'} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="flex-1" />
                <div className="flex gap-1">
                  <Input placeholder="Init" type="number" value={init} onChange={e => setInit(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="w-20" />
                  <Button variant="outline" size="icon" onClick={rollInit} title="Rolar d20">
                    <Dices className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={add} size="icon"><Plus className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {sorted.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Round & controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
                  <Swords className="w-3.5 h-3.5" /> Round {round}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setShowHp(!showHp)} className="text-xs text-muted-foreground">
                  {showHp ? 'Ocultar HP' : 'Mostrar HP'}
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={resetCombat} className="gap-1 text-destructive hover:text-destructive">
                <RotateCcw className="w-3 h-3" />Limpar
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevTurn} className="flex-1">← Anterior</Button>
              <Button onClick={nextTurn} className="flex-1 gap-1" size="lg">
                <ChevronRight className="w-4 h-4" />Próximo Turno
              </Button>
            </div>

            {/* Combatant list */}
            <div className="space-y-2">
              <AnimatePresence>
                {sorted.map((c, i) => {
                  const isActive = i === currentTurn % sorted.length;
                  const hpPercent = c.maxHp && c.maxHp > 0 ? Math.max(0, Math.min(100, ((c.hp || 0) / c.maxHp) * 100)) : null;
                  const expanded = expandedId === c.id;
                  const isMonster = c.type === 'monster';

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      layout
                    >
                      <Card className={`overflow-hidden transition-all duration-300 ${
                        isActive
                          ? isMonster
                            ? 'border-destructive/60 bg-destructive/5 shadow-[0_0_15px_hsl(var(--destructive)/0.15)]'
                            : 'border-primary/60 bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.15)]'
                          : 'card-hover'
                      }`}>
                        <CardContent className="p-0">
                          <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedId(expanded ? null : c.id)}
                          >
                            <div className="flex items-center gap-3">
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={`w-3 h-3 rounded-full ${isMonster ? 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.6)]' : 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]'}`}
                                />
                              )}
                              <div className="flex items-center gap-2">
                                {isMonster && <Skull className="w-4 h-4 text-destructive" />}
                                <span className={`font-semibold text-lg ${isActive ? (isMonster ? 'text-destructive' : 'text-primary') : ''}`}>{c.name}</span>
                                {isMonster && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Monstro</Badge>
                                )}
                              </div>
                              {(c.conditions || []).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {c.conditions!.map(cond => (
                                    <Badge key={cond} variant="secondary" className="text-[10px] px-1.5 py-0">{cond}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {showHp && hpPercent !== null && (
                                <div className="flex items-center gap-1.5">
                                  <Heart className="w-3.5 h-3.5 text-accent" />
                                  <span className="text-sm font-semibold">{c.hp}/{c.maxHp}</span>
                                </div>
                              )}
                              {showHp && c.ca && c.ca > 0 && (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-sm font-semibold">{c.ca}</span>
                                </div>
                              )}
                              <span className={`text-2xl font-display font-bold ${isMonster ? 'text-destructive' : 'text-primary'}`}>{c.initiative}</span>
                              <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); remove(c.id); }}>
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>

                          {/* HP Bar */}
                          {showHp && hpPercent !== null && (
                            <div className="px-4 pb-1">
                              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-destructive'}`}
                                  animate={{ width: `${hpPercent}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Expanded details */}
                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/50">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">HP</label>
                                      <NumberInput className="h-8 text-sm" value={c.hp || 0} onChange={v => updateField(c.id, 'hp', v)} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">HP Max</label>
                                      <NumberInput className="h-8 text-sm" value={c.maxHp || 0} onChange={v => updateField(c.id, 'maxHp', v)} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">CA</label>
                                      <NumberInput className="h-8 text-sm" value={c.ca || 10} onChange={v => updateField(c.id, 'ca', v)} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-muted-foreground mb-1 block">Condições</label>
                                    <div className="flex flex-wrap gap-1">
                                      {CONDITION_OPTIONS.map(cond => (
                                        <Badge
                                          key={cond}
                                          variant={(c.conditions || []).includes(cond) ? 'default' : 'outline'}
                                          className="cursor-pointer text-[10px] hover:bg-primary/10 transition-colors"
                                          onClick={() => toggleCondition(c.id, cond)}
                                        >
                                          {cond}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {sorted.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="card-hover">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Adicione combatentes para iniciar</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Initiative;
