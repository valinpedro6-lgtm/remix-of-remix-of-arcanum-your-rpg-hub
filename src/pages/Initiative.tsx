import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronRight, RotateCcw, Dices, Swords, Heart, Shield, Skull, User, Zap, Minus, Copy, UserPlus, Users } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedSheet {
  id: string;
  name: string;
  hp?: number;
  maxHp?: number;
  ca?: number;
}

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp?: number;
  maxHp?: number;
  ca?: number;
  conditions?: string[];
  type: 'player' | 'monster';
  deathSaves?: { success: number; fail: number };
  tempHp?: number;
  notes?: string;
}

const CONDITION_OPTIONS = [
  { name: 'Atordoado', emoji: '💫' },
  { name: 'Envenenado', emoji: '🤢' },
  { name: 'Incapacitado', emoji: '😵' },
  { name: 'Invisível', emoji: '👻' },
  { name: 'Prone', emoji: '🔻' },
  { name: 'Restringido', emoji: '⛓️' },
  { name: 'Amedrontado', emoji: '😱' },
  { name: 'Agarrado', emoji: '🤼' },
  { name: 'Concentrando', emoji: '🧠' },
  { name: 'Cego', emoji: '🙈' },
  { name: 'Surdo', emoji: '🙉' },
  { name: 'Charme', emoji: '💕' },
  { name: 'Paralisado', emoji: '🥶' },
  { name: 'Petrificado', emoji: '🗿' },
];

const QUICK_DAMAGE = [1, 5, 10, 20];

const Initiative = () => {
  const [combatants, setCombatants] = useLocalStorage<Combatant[]>('arcanum-initiative', []);
  const [currentTurn, setCurrentTurn] = useLocalStorage<number>('arcanum-initiative-turn', 0);
  const [round, setRound] = useLocalStorage<number>('arcanum-initiative-round', 1);
  const [savedPlayers] = useLocalStorage<SavedSheet[]>('arcanum-players', []);
  const [savedMonsters] = useLocalStorage<SavedSheet[]>('arcanum-monsters', []);
  const [name, setName] = useState('');
  const [init, setInit] = useState('');
  const [showHp, setShowHp] = useState(true);
  const [combatantType, setCombatantType] = useState<'player' | 'monster'>('player');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkAdd, setBulkAdd] = useState(false);
  const [bulkCount, setBulkCount] = useState(3);
  const [showImport, setShowImport] = useState(false);

  const importSheet = (sheet: SavedSheet, type: 'player' | 'monster') => {
    setCombatants(prev => [...prev, {
      id: crypto.randomUUID(),
      name: sheet.name || 'Sem Nome',
      initiative: Math.floor(Math.random() * 20) + 1,
      hp: sheet.hp ?? sheet.maxHp ?? 0,
      maxHp: sheet.maxHp ?? sheet.hp ?? 0,
      ca: sheet.ca ?? 10,
      conditions: [],
      type,
    }]);
  };

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const add = () => {
    if (!name.trim()) return;
    if (bulkAdd) {
      const newCombatants: Combatant[] = [];
      for (let i = 1; i <= bulkCount; i++) {
        newCombatants.push({
          id: crypto.randomUUID(),
          name: `${name.trim()} ${i}`,
          initiative: Math.floor(Math.random() * 20) + 1,
          hp: 0, maxHp: 0, ca: 10,
          conditions: [],
          type: combatantType,
        });
      }
      setCombatants(prev => [...prev, ...newCombatants]);
    } else {
      setCombatants(prev => [...prev, {
        id: crypto.randomUUID(),
        name: name.trim(),
        initiative: parseInt(init) || 0,
        hp: 0, maxHp: 0, ca: 10,
        conditions: [],
        type: combatantType,
      }]);
    }
    setName('');
    setInit('');
  };

  const rollInit = () => setInit(String(Math.floor(Math.random() * 20) + 1));
  const remove = (id: string) => setCombatants(prev => prev.filter(c => c.id !== id));

  const duplicate = (c: Combatant) => {
    setCombatants(prev => [...prev, { ...c, id: crypto.randomUUID(), name: `${c.name} (2)` }]);
  };

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

  const applyDamage = (id: string, amount: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const tempHp = c.tempHp || 0;
      let remaining = amount;
      let newTemp = tempHp;
      if (tempHp > 0) {
        if (remaining <= tempHp) { newTemp = tempHp - remaining; remaining = 0; }
        else { remaining -= tempHp; newTemp = 0; }
      }
      const newHp = Math.max(0, (c.hp || 0) - remaining);
      return { ...c, hp: newHp, tempHp: newTemp };
    }));
  };

  const applyHeal = (id: string, amount: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newHp = Math.min(c.maxHp || 0, (c.hp || 0) + amount);
      return { ...c, hp: newHp };
    }));
  };

  const toggleCondition = (id: string, cond: string) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const conditions = c.conditions || [];
      return { ...c, conditions: conditions.includes(cond) ? conditions.filter(x => x !== cond) : [...conditions, cond] };
    }));
  };

  const rollAllInit = () => {
    setCombatants(prev => prev.map(c => ({
      ...c, initiative: Math.floor(Math.random() * 20) + 1
    })));
    setCurrentTurn(0);
    setRound(1);
  };

  const playerCount = combatants.filter(c => c.type === 'player').length;
  const monsterCount = combatants.filter(c => c.type === 'monster').length;

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
                <Button variant={combatantType === 'player' ? 'default' : 'ghost'} size="sm" className="flex-1 gap-1.5" onClick={() => setCombatantType('player')}>
                  <User className="w-3.5 h-3.5" />Jogador
                </Button>
                <Button variant={combatantType === 'monster' ? 'destructive' : 'ghost'} size="sm" className="flex-1 gap-1.5" onClick={() => setCombatantType('monster')}>
                  <Skull className="w-3.5 h-3.5" />Monstro
                </Button>
              </div>

              <div className="flex gap-2">
                <Input placeholder={combatantType === 'monster' ? 'Nome do Monstro' : 'Nome do Jogador'} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="flex-1" />
                {!bulkAdd && (
                  <div className="flex gap-1">
                    <Input placeholder="Init" type="number" value={init} onChange={e => setInit(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="w-20" />
                    <Button variant="outline" size="icon" onClick={rollInit} title="Rolar d20"><Dices className="w-4 h-4" /></Button>
                  </div>
                )}
                <Button onClick={add} size="icon"><Plus className="w-4 h-4" /></Button>
              </div>

              {/* Bulk add toggle */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant={bulkAdd ? 'default' : 'outline'} size="sm" onClick={() => setBulkAdd(!bulkAdd)} className="text-xs gap-1">
                  <Copy className="w-3 h-3" />{bulkAdd ? 'Grupo ON' : 'Em grupo'}
                </Button>
                {bulkAdd && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Qtd:</span>
                    <NumberInput min={2} value={bulkCount} onChange={setBulkCount} className="w-16 h-7 text-xs" />
                  </div>
                )}
                <Button
                  variant={showImport ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowImport(v => !v)}
                  className="text-xs gap-1 ml-auto"
                >
                  <UserPlus className="w-3 h-3" />
                  Importar Fichas ({savedPlayers.length + savedMonsters.length})
                </Button>
              </div>

              {/* Import saved sheets */}
              <AnimatePresence>
                {showImport && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-3 border-t border-border/50">
                      {savedPlayers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
                            <Users className="w-3 h-3" /> Jogadores Salvos
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {savedPlayers.map(p => (
                              <Button key={p.id} variant="outline" size="sm" className="h-7 text-xs gap-1 hover:bg-primary/10"
                                onClick={() => importSheet(p, 'player')}>
                                <Plus className="w-3 h-3" />{p.name || 'Sem nome'}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      {savedMonsters.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive mb-1.5">
                            <Skull className="w-3 h-3" /> Monstros Salvos
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {savedMonsters.map(m => (
                              <Button key={m.id} variant="outline" size="sm" className="h-7 text-xs gap-1 hover:bg-destructive/10"
                                onClick={() => importSheet(m, 'monster')}>
                                <Plus className="w-3 h-3" />{m.name || 'Sem nome'}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      {savedPlayers.length === 0 && savedMonsters.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Nenhuma ficha salva. Cadastre em Jogadores ou Monstros.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {sorted.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Round & controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
                  <Swords className="w-3.5 h-3.5" /> Round {round}
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <User className="w-3 h-3" />{playerCount}
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Skull className="w-3 h-3" />{monsterCount}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={rollAllInit} className="gap-1 text-xs">
                  <Dices className="w-3 h-3" />Rerolar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={resetCombat} className="gap-1 text-destructive hover:text-destructive">
                  <RotateCcw className="w-3 h-3" />Limpar
                </Button>
              </div>
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
                  const isDead = c.maxHp && c.maxHp > 0 && (c.hp || 0) <= 0;

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: isDead ? 0.5 : 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      layout
                    >
                      <Card className={`overflow-hidden transition-all duration-300 ${
                        isDead ? 'opacity-50 grayscale' :
                        isActive
                          ? isMonster
                            ? 'border-destructive/60 bg-destructive/5 shadow-[0_0_15px_hsl(var(--destructive)/0.15)]'
                            : 'border-primary/60 bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.15)]'
                          : 'card-hover'
                      }`}>
                        <CardContent className="p-0">
                          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expanded ? null : c.id)}>
                            <div className="flex items-center gap-3 min-w-0">
                              {isActive && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                  className={`w-3 h-3 rounded-full shrink-0 ${isMonster ? 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.6)]' : 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]'}`}
                                />
                              )}
                              <div className="flex items-center gap-2 min-w-0">
                                {isMonster ? <Skull className="w-4 h-4 text-destructive shrink-0" /> : <User className="w-4 h-4 text-primary shrink-0" />}
                                <span className={`font-semibold text-lg truncate ${isDead ? 'line-through' : ''} ${isActive ? (isMonster ? 'text-destructive' : 'text-primary') : ''}`}>{c.name}</span>
                                {isDead && <Badge variant="destructive" className="text-[10px] px-1 py-0 shrink-0">Morto</Badge>}
                              </div>
                              {(c.conditions || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 shrink-0">
                                  {c.conditions!.slice(0, 3).map(cond => {
                                    const info = CONDITION_OPTIONS.find(co => co.name === cond);
                                    return <Badge key={cond} variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">{info?.emoji} {cond}</Badge>;
                                  })}
                                  {c.conditions!.length > 3 && <Badge variant="secondary" className="text-[10px] px-1 py-0">+{c.conditions!.length - 3}</Badge>}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {hpPercent !== null && (
                                <div className="flex items-center gap-1.5">
                                  <Heart className={`w-3.5 h-3.5 ${hpPercent > 50 ? 'text-green-500' : hpPercent > 25 ? 'text-yellow-500' : 'text-destructive'}`} />
                                  <span className="text-sm font-semibold">{c.hp}/{c.maxHp}</span>
                                </div>
                              )}
                              {c.ca && c.ca > 0 && (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-sm font-semibold">{c.ca}</span>
                                </div>
                              )}
                              <div onClick={e => e.stopPropagation()} className="flex items-center gap-1">
                                <NumberInput
                                  value={c.initiative}
                                  onChange={v => updateField(c.id, 'initiative', v)}
                                  className={`w-16 h-9 text-center text-lg font-display font-bold ${isMonster ? 'text-destructive border-destructive/40' : 'text-primary border-primary/40'}`}
                                />
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Rerolar d20"
                                  onClick={() => updateField(c.id, 'initiative', Math.floor(Math.random() * 20) + 1)}>
                                  <Dices className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); remove(c.id); }}>
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>

                          {/* HP Bar */}
                          {hpPercent !== null && (
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
                                  <div className="grid grid-cols-4 gap-2">
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">HP</label>
                                      <NumberInput className="h-8 text-sm" value={c.hp || 0} onChange={v => updateField(c.id, 'hp', v)} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">HP Max</label>
                                      <NumberInput className="h-8 text-sm" value={c.maxHp || 0} onChange={v => updateField(c.id, 'maxHp', v)} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">HP Temp</label>
                                      <NumberInput className="h-8 text-sm" value={c.tempHp || 0} onChange={v => updateField(c.id, 'tempHp', v)} min={0} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground">CA</label>
                                      <NumberInput className="h-8 text-sm" value={c.ca || 10} onChange={v => updateField(c.id, 'ca', v)} />
                                    </div>
                                  </div>

                                  {/* Quick damage/heal */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] text-muted-foreground">Dano Rápido</label>
                                    <div className="flex gap-1.5 flex-wrap">
                                      {QUICK_DAMAGE.map(d => (
                                        <Button key={d} variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => applyDamage(c.id, d)}>
                                          <Minus className="w-3 h-3" />{d}
                                        </Button>
                                      ))}
                                      <div className="w-px bg-border/50 mx-1" />
                                      {QUICK_DAMAGE.map(d => (
                                        <Button key={d} variant="outline" size="sm" className="h-7 text-xs gap-1 text-green-500 hover:text-green-500 hover:bg-green-500/10"
                                          onClick={() => applyHeal(c.id, d)}>
                                          <Plus className="w-3 h-3" />{d}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Conditions */}
                                  <div>
                                    <label className="text-[10px] text-muted-foreground mb-1 block">Condições</label>
                                    <div className="flex flex-wrap gap-1">
                                      {CONDITION_OPTIONS.map(cond => (
                                        <Badge
                                          key={cond.name}
                                          variant={(c.conditions || []).includes(cond.name) ? 'default' : 'outline'}
                                          className="cursor-pointer text-[10px] hover:bg-primary/10 transition-colors gap-0.5"
                                          onClick={() => toggleCondition(c.id, cond.name)}
                                        >
                                          {cond.emoji} {cond.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-1.5 pt-1">
                                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => duplicate(c)}>
                                      <Copy className="w-3 h-3" />Duplicar
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => updateField(c.id, 'initiative', Math.floor(Math.random() * 20) + 1)}>
                                      <Dices className="w-3 h-3" />Rerolar Init
                                    </Button>
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
