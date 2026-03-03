import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Edit, Skull, Shield, Heart, Zap, Swords, BookOpen, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Attribute {
  name: string;
  value: number;
  modifier: number;
}

interface Monster {
  id: string;
  name: string;
  type: string;
  size: string;
  alignment: string;
  challengeRating: string;
  image: string;
  hp: number;
  maxHp: number;
  ca: number;
  movement: number;
  attributes: Attribute[];
  customAttributes: Attribute[];
  skills: string;
  attacks: string;
  abilities: string;
  resistances: string;
  immunities: string;
  senses: string;
  languages: string;
  inventory: string;
  notes: string;
}

const DEFAULT_ATTRIBUTES: Attribute[] = [
  { name: 'Força', value: 10, modifier: 0 },
  { name: 'Destreza', value: 10, modifier: 0 },
  { name: 'Constituição', value: 10, modifier: 0 },
  { name: 'Intuição', value: 10, modifier: 0 },
  { name: 'Sabedoria', value: 10, modifier: 0 },
  { name: 'Carisma', value: 10, modifier: 0 },
];

const ATTACK_SUGGESTIONS = [
  'Mordida +5, 2d6+3 perfurante',
  'Garras +4, 1d8+2 cortante',
  'Cauda +3, 1d10+1 contundente',
  'Sopro de Fogo (CD 13), 4d6 fogo',
  'Sopro Gélido (CD 12), 3d8 gelo',
  'Teia (CD 11), restringido',
  'Investida +6, 2d8+4 contundente',
  'Ferrão +5, 1d4+3 perfurante + 2d6 veneno',
  'Raio Ocular (CD 14), 3d10 necrótico',
  'Esmagamento +7, 2d10+5 contundente',
];

const ABILITY_SUGGESTIONS = [
  'Visão no Escuro 18m',
  'Resistência a Magia',
  'Regeneração 5 HP/turno',
  'Imunidade a Veneno',
  'Voo 12m',
  'Faro Aguçado',
  'Camuflagem (vantagem em furtividade)',
  'Resistência a Dano Não-mágico',
  'Aura de Medo (CD 12)',
  'Sentido Sísmico 9m',
];

const calcModifier = (value: number) => Math.floor((value - 10) / 2);
const modStr = (m: number) => m >= 0 ? `+${m}` : `${m}`;

const emptyMonster = (): Monster => ({
  id: crypto.randomUUID(),
  name: '', type: '', size: 'Médio', alignment: '', challengeRating: '', image: '',
  hp: 10, maxHp: 10, ca: 10, movement: 9,
  attributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
  customAttributes: [],
  skills: '', attacks: '', abilities: '', resistances: '', immunities: '', senses: '', languages: '', inventory: '', notes: '',
});

const Monsters = () => {
  const [monsters, setMonsters] = useLocalStorage<Monster[]>('arcanum-monsters', []);
  const [editing, setEditing] = useState<Monster | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAttrName, setNewAttrName] = useState('');

  const save = () => {
    if (!editing?.name.trim()) return;
    const updated = {
      ...editing,
      attributes: editing.attributes.map(a => ({ ...a, modifier: calcModifier(a.value) })),
      customAttributes: editing.customAttributes.map(a => ({ ...a, modifier: calcModifier(a.value) })),
    };
    setMonsters(prev => {
      const exists = prev.find(m => m.id === updated.id);
      return exists ? prev.map(m => m.id === updated.id ? updated : m) : [...prev, updated];
    });
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => setMonsters(prev => prev.filter(m => m.id !== id));

  const openEdit = (m: Monster) => {
    setEditing({
      ...m,
      type: m.type || '', size: m.size || 'Médio', alignment: m.alignment || '', challengeRating: m.challengeRating || '',
      movement: m.movement || 9,
      attributes: m.attributes?.map(a => ({ ...a })) || DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
      customAttributes: m.customAttributes?.map(a => ({ ...a })) || [],
      resistances: m.resistances || '', immunities: m.immunities || '', senses: m.senses || '', languages: m.languages || '', inventory: m.inventory || '', skills: m.skills || '',
    });
    setOpen(true);
  };

  const setAttr = (index: number, val: number, custom = false) => {
    if (!editing) return;
    const key = custom ? 'customAttributes' : 'attributes';
    const arr = [...editing[key]];
    arr[index] = { ...arr[index], value: val, modifier: calcModifier(val) };
    setEditing({ ...editing, [key]: arr });
  };

  const addCustomAttr = () => {
    if (!editing || !newAttrName.trim()) return;
    setEditing({ ...editing, customAttributes: [...editing.customAttributes, { name: newAttrName.trim(), value: 10, modifier: 0 }] });
    setNewAttrName('');
  };

  const removeCustomAttr = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, customAttributes: editing.customAttributes.filter((_, i) => i !== index) });
  };

  const addAttack = (attack: string) => {
    if (!editing) return;
    const current = editing.attacks.trim();
    setEditing({ ...editing, attacks: current ? `${current}\n${attack}` : attack });
  };

  const addAbility = (ability: string) => {
    if (!editing) return;
    const current = editing.abilities.trim();
    setEditing({ ...editing, abilities: current ? `${current}\n${ability}` : ability });
  };

  const allAttributes = (m: Monster) => [...(m.attributes || []), ...(m.customAttributes || [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Monstros</h1>
        <Button onClick={() => { setEditing(emptyMonster()); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
      </div>

      {monsters.length === 0 && (
        <Card className="card-hover"><CardContent className="p-8 text-center text-muted-foreground">Nenhum monstro cadastrado</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {monsters.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
              <Card className="card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    {m.image ? (
                      <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden shrink-0"><img src={m.image} alt={m.name} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Skull className="w-8 h-8 text-muted-foreground/30" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-display font-bold truncate">{m.name || 'Sem nome'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {[m.size, m.type, m.alignment].filter(Boolean).join(' • ') || 'Sem tipo'}
                        {m.challengeRating && ` • ND ${m.challengeRating}`}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <div className="flex items-center gap-1"><Heart className="w-4 h-4 text-accent" /><span className="text-sm font-semibold">{m.hp}/{m.maxHp || m.hp}</span></div>
                        <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{m.ca}</span></div>
                        {m.movement > 0 && <span className="text-sm text-muted-foreground">{m.movement}m</span>}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                      {expandedId === m.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      {expandedId === m.id ? 'Recolher' : 'Expandir ficha'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {expandedId === m.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Separator />
                        <div className="p-4 space-y-4">
                          {/* Attributes */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Swords className="w-3.5 h-3.5" />Atributos</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {allAttributes(m).map(a => (
                                <div key={a.name} className="text-center p-2 rounded-md bg-secondary/50">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{a.name.substring(0, 3)}</p>
                                  <p className="text-lg font-bold">{a.value}</p>
                                  <p className="text-xs text-primary font-semibold">{modStr(a.modifier)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {m.skills && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Perícias</h4><p className="text-sm whitespace-pre-line">{m.skills}</p></div>}
                          {m.attacks && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Ataques</h4><p className="text-sm whitespace-pre-line">{m.attacks}</p></div>}
                          {m.abilities && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Habilidades</h4><p className="text-sm whitespace-pre-line">{m.abilities}</p></div>}
                          {m.resistances && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Resistências</h4><p className="text-sm whitespace-pre-line">{m.resistances}</p></div>}
                          {m.immunities && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Imunidades</h4><p className="text-sm whitespace-pre-line">{m.immunities}</p></div>}
                          {m.senses && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Sentidos</h4><p className="text-sm">{m.senses}</p></div>}
                          {m.languages && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Idiomas</h4><p className="text-sm">{m.languages}</p></div>}
                          {m.inventory && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Tesouro / Inventário</h4><p className="text-sm whitespace-pre-line">{m.inventory}</p></div>}
                          {m.notes && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Anotações</h4><p className="text-sm whitespace-pre-line">{m.notes}</p></div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Separator />
                  <div className="flex gap-2 p-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="flex-1"><Edit className="w-3 h-3 mr-1" />Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => remove(m.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing && monsters.find(m => m.id === editing.id) ? 'Editar' : 'Novo'} Monstro</DialogTitle></DialogHeader>
          {editing && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="combat">Combate</TabsTrigger>
                <TabsTrigger value="other">Outros</TabsTrigger>
              </TabsList>

              {/* INFO */}
              <TabsContent value="info" className="space-y-3 mt-3">
                <Input placeholder="Nome" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Tipo (ex: Morto-vivo)" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })} />
                  <Input placeholder="Tamanho (ex: Grande)" value={editing.size} onChange={e => setEditing({ ...editing, size: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Alinhamento" value={editing.alignment} onChange={e => setEditing({ ...editing, alignment: e.target.value })} />
                  <Input placeholder="Nível de Desafio" value={editing.challengeRating} onChange={e => setEditing({ ...editing, challengeRating: e.target.value })} />
                </div>
                <Input placeholder="URL da Imagem" value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })} />
              </TabsContent>

              {/* ATTRIBUTES */}
              <TabsContent value="attributes" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  {editing.attributes.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-2">
                      <span className="text-sm w-24 truncate">{a.name}</span>
                      <Input type="number" className="w-20" value={a.value} onChange={e => setAttr(i, parseInt(e.target.value) || 0)} />
                      <span className="text-xs text-primary font-semibold w-8">{modStr(calcModifier(a.value))}</span>
                    </div>
                  ))}
                </div>

                {editing.customAttributes.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">Atributos customizados</p>
                    <div className="grid grid-cols-2 gap-3">
                      {editing.customAttributes.map((a, i) => (
                        <div key={`${a.name}-${i}`} className="flex items-center gap-2">
                          <span className="text-sm w-24 truncate">{a.name}</span>
                          <Input type="number" className="w-20" value={a.value} onChange={e => setAttr(i, parseInt(e.target.value) || 0, true)} />
                          <span className="text-xs text-primary font-semibold w-8">{modStr(calcModifier(a.value))}</span>
                          <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => removeCustomAttr(i)}><X className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Input placeholder="Nome do novo atributo" value={newAttrName} onChange={e => setNewAttrName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomAttr()} />
                  <Button variant="outline" size="sm" onClick={addCustomAttr}><Plus className="w-3 h-3" /></Button>
                </div>

                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Perícias</label>
                  <Textarea placeholder="Percepção +5, Furtividade +4..." value={editing.skills} onChange={e => setEditing({ ...editing, skills: e.target.value })} rows={2} />
                </div>
              </TabsContent>

              {/* COMBAT */}
              <TabsContent value="combat" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">HP</label><Input type="number" value={editing.hp} onChange={e => setEditing({ ...editing, hp: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="text-xs text-muted-foreground">HP Máximo</label><Input type="number" value={editing.maxHp} onChange={e => setEditing({ ...editing, maxHp: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">CA</label><Input type="number" value={editing.ca} onChange={e => setEditing({ ...editing, ca: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="text-xs text-muted-foreground">Deslocamento (m)</label><Input type="number" value={editing.movement} onChange={e => setEditing({ ...editing, movement: parseInt(e.target.value) || 0 })} /></div>
                </div>

                <div>
                  <Textarea placeholder="Ataques (ex: Mordida +5, 2d6+3)" value={editing.attacks} onChange={e => setEditing({ ...editing, attacks: e.target.value })} rows={3} />
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" />Sugestões:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ATTACK_SUGGESTIONS.map(a => (
                        <Badge key={a} variant="outline" className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors text-xs" onClick={() => addAttack(a)}>
                          {a.split(',')[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Textarea placeholder="Resistências" value={editing.resistances} onChange={e => setEditing({ ...editing, resistances: e.target.value })} rows={2} />
                </div>
                <div>
                  <Textarea placeholder="Imunidades" value={editing.immunities} onChange={e => setEditing({ ...editing, immunities: e.target.value })} rows={2} />
                </div>
              </TabsContent>

              {/* OTHER */}
              <TabsContent value="other" className="space-y-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Habilidades Especiais</label>
                  <Textarea placeholder="Habilidades especiais" value={editing.abilities} onChange={e => setEditing({ ...editing, abilities: e.target.value })} rows={3} />
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1.5">Sugestões:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ABILITY_SUGGESTIONS.map(a => (
                        <Badge key={a} variant="outline" className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors text-xs" onClick={() => addAbility(a)}>
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1 block">Sentidos</label><Input placeholder="Visão no escuro 18m" value={editing.senses} onChange={e => setEditing({ ...editing, senses: e.target.value })} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Idiomas</label><Input placeholder="Comum, Dracônico" value={editing.languages} onChange={e => setEditing({ ...editing, languages: e.target.value })} /></div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tesouro / Inventário</label>
                  <Textarea placeholder="Itens que o monstro carrega ou guarda..." rows={3} value={editing.inventory} onChange={e => setEditing({ ...editing, inventory: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Anotações</label>
                  <Textarea placeholder="Notas gerais..." rows={3} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
                </div>
              </TabsContent>

              <Button onClick={save} className="w-full mt-4">Salvar</Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Monsters;
