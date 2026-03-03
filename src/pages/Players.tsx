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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Edit, Shield, Heart, User, Zap, Swords, BookOpen, Backpack, Sparkles, X, ChevronDown, ChevronUp, RotateCcw, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Attribute {
  name: string;
  value: number;
  modifier: number;
  manualModifier: boolean;
}

interface Skill {
  name: string;
  bonus: number;
  proficient: boolean;
  attribute: string;
}

interface Player {
  id: string;
  name: string;
  playerName: string;
  race: string;
  className: string;
  profession: string;
  level: number;
  experience: number;
  image: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  energy: number;
  maxEnergy: number;
  ca: number;
  movement: number;
  attributes: Attribute[];
  customAttributes: Attribute[];
  skills: Skill[];
  customSkills: Skill[];
  inventory: string;
  abilities: string;
  notes: string;
}

const DEFAULT_ATTRIBUTES: Attribute[] = [
  { name: 'Força', value: 10, modifier: 0, manualModifier: false },
  { name: 'Destreza', value: 10, modifier: 0, manualModifier: false },
  { name: 'Constituição', value: 10, modifier: 0, manualModifier: false },
  { name: 'Intuição', value: 10, modifier: 0, manualModifier: false },
  { name: 'Sabedoria', value: 10, modifier: 0, manualModifier: false },
  { name: 'Carisma', value: 10, modifier: 0, manualModifier: false },
];

const DEFAULT_SKILLS: Skill[] = [
  { name: 'Acrobacia', bonus: 0, proficient: false, attribute: 'Destreza' },
  { name: 'Arcanismo', bonus: 0, proficient: false, attribute: 'Intuição' },
  { name: 'Atletismo', bonus: 0, proficient: false, attribute: 'Força' },
  { name: 'Furtividade', bonus: 0, proficient: false, attribute: 'Destreza' },
  { name: 'Intimidação', bonus: 0, proficient: false, attribute: 'Carisma' },
  { name: 'Investigação', bonus: 0, proficient: false, attribute: 'Intuição' },
  { name: 'Medicina', bonus: 0, proficient: false, attribute: 'Sabedoria' },
  { name: 'Percepção', bonus: 0, proficient: false, attribute: 'Sabedoria' },
  { name: 'Persuasão', bonus: 0, proficient: false, attribute: 'Carisma' },
  { name: 'Sobrevivência', bonus: 0, proficient: false, attribute: 'Sabedoria' },
];

const calcModifier = (value: number) => Math.floor((value - 10) / 2);
const modStr = (m: number) => m >= 0 ? `+${m}` : `${m}`;

const emptyPlayer = (): Player => ({
  id: crypto.randomUUID(),
  name: '', playerName: '', race: '', className: '', profession: '', level: 1, experience: 0, image: '',
  hp: 10, maxHp: 10, mana: 0, maxMana: 0, energy: 10, maxEnergy: 10, ca: 10, movement: 9,
  attributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
  customAttributes: [],
  skills: DEFAULT_SKILLS.map(s => ({ ...s })),
  customSkills: [],
  inventory: '', abilities: '', notes: '',
});

const Players = () => {
  const [players, setPlayers] = useLocalStorage<Player[]>('arcanum-players', []);
  const [editing, setEditing] = useState<Player | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAttrName, setNewAttrName] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAttr, setNewSkillAttr] = useState('');

  const save = () => {
    if (!editing?.name.trim()) return;
    const updated = {
      ...editing,
      attributes: editing.attributes.map(a => ({
        ...a,
        modifier: a.manualModifier ? a.modifier : calcModifier(a.value),
      })),
      customAttributes: editing.customAttributes.map(a => ({
        ...a,
        modifier: a.manualModifier ? a.modifier : calcModifier(a.value),
      })),
    };
    setPlayers(prev => {
      const exists = prev.find(p => p.id === updated.id);
      return exists ? prev.map(p => p.id === updated.id ? updated : p) : [...prev, updated];
    });
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));

  const duplicate = (p: Player) => {
    const dup = { ...p, id: crypto.randomUUID(), name: `${p.name} (cópia)`, attributes: p.attributes.map(a => ({...a})), customAttributes: p.customAttributes.map(a => ({...a})), skills: p.skills.map(s => ({...s})), customSkills: p.customSkills.map(s => ({...s})) };
    setPlayers(prev => [...prev, dup]);
  };

  const openNew = () => { setEditing(emptyPlayer()); setOpen(true); };

  const openEdit = (p: Player) => {
    setEditing({
      ...p,
      attributes: p.attributes?.map(a => ({ ...a, manualModifier: a.manualModifier ?? false })) || DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
      customAttributes: p.customAttributes?.map(a => ({ ...a, manualModifier: a.manualModifier ?? false })) || [],
      skills: p.skills?.map(s => ({ ...s })) || DEFAULT_SKILLS.map(s => ({ ...s })),
      customSkills: p.customSkills?.map(s => ({ ...s })) || [],
    });
    setOpen(true);
  };

  const setAttrValue = (index: number, val: number, custom = false) => {
    if (!editing) return;
    const key = custom ? 'customAttributes' : 'attributes';
    const arr = [...editing[key]];
    const a = arr[index];
    arr[index] = { ...a, value: val, modifier: a.manualModifier ? a.modifier : calcModifier(val) };
    setEditing({ ...editing, [key]: arr });
  };

  const setAttrModifier = (index: number, mod: number, custom = false) => {
    if (!editing) return;
    const key = custom ? 'customAttributes' : 'attributes';
    const arr = [...editing[key]];
    arr[index] = { ...arr[index], modifier: mod, manualModifier: true };
    setEditing({ ...editing, [key]: arr });
  };

  const resetModifier = (index: number, custom = false) => {
    if (!editing) return;
    const key = custom ? 'customAttributes' : 'attributes';
    const arr = [...editing[key]];
    arr[index] = { ...arr[index], modifier: calcModifier(arr[index].value), manualModifier: false };
    setEditing({ ...editing, [key]: arr });
  };

  const setSkill = (index: number, field: string, val: any, custom = false) => {
    if (!editing) return;
    const key = custom ? 'customSkills' : 'skills';
    const arr = [...editing[key]];
    arr[index] = { ...arr[index], [field]: val };
    setEditing({ ...editing, [key]: arr });
  };

  const addCustomAttr = () => {
    if (!editing || !newAttrName.trim()) return;
    setEditing({ ...editing, customAttributes: [...editing.customAttributes, { name: newAttrName.trim(), value: 10, modifier: 0, manualModifier: false }] });
    setNewAttrName('');
  };

  const removeCustomAttr = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, customAttributes: editing.customAttributes.filter((_, i) => i !== index) });
  };

  const addCustomSkill = () => {
    if (!editing || !newSkillName.trim()) return;
    setEditing({ ...editing, customSkills: [...editing.customSkills, { name: newSkillName.trim(), bonus: 0, proficient: false, attribute: newSkillAttr || 'Nenhum' }] });
    setNewSkillName('');
    setNewSkillAttr('');
  };

  const removeCustomSkill = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, customSkills: editing.customSkills.filter((_, i) => i !== index) });
  };

  const allAttributes = (p: Player) => [...(p.attributes || []), ...(p.customAttributes || [])];
  const allSkills = (p: Player) => [...(p.skills || []), ...(p.customSkills || [])];

  const AttrEditor = ({ a, i, custom = false }: { a: Attribute; i: number; custom?: boolean }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
      <span className="text-sm font-semibold w-24 truncate">{a.name}</span>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[10px] text-muted-foreground">Valor</label>
        <Input type="number" className="w-16 h-8 text-center text-sm" value={a.value} onChange={e => setAttrValue(i, parseInt(e.target.value) || 0, custom)} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[10px] text-muted-foreground">Mod</label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className={`w-16 h-8 text-center text-sm ${a.manualModifier ? 'border-primary/50 bg-primary/5' : ''}`}
            value={a.modifier}
            onChange={e => setAttrModifier(i, parseInt(e.target.value) || 0, custom)}
          />
          {a.manualModifier && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0.5 h-auto" onClick={() => resetModifier(i, custom)}>
                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Restaurar cálculo automático ({modStr(calcModifier(a.value))})</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      {custom && (
        <Button variant="ghost" size="sm" className="p-1 h-auto ml-auto" onClick={() => removeCustomAttr(i)}><X className="w-3 h-3" /></Button>
      )}
    </div>
  );

  const SkillEditor = ({ s, i, custom = false }: { s: Skill; i: number; custom?: boolean }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
      <button
        className={`text-sm w-32 text-left truncate transition-colors ${s.proficient ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => setSkill(i, 'proficient', !s.proficient, custom)}
      >
        <span className={`inline-block w-4 ${s.proficient ? 'text-primary' : ''}`}>{s.proficient ? '●' : '○'}</span>
        {s.name}
      </button>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[10px] text-muted-foreground">Bônus</label>
        <Input type="number" className="w-16 h-8 text-center text-sm" value={s.bonus} onChange={e => setSkill(i, 'bonus', parseInt(e.target.value) || 0, custom)} />
      </div>
      <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">{s.attribute}</span>
      {custom && (
        <Button variant="ghost" size="sm" className="p-1 h-auto ml-auto" onClick={() => removeCustomSkill(i)}><X className="w-3 h-3" /></Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Jogadores</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Adicionar</Button>
      </div>

      {players.length === 0 && (
        <Card className="card-hover glow-border">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">Nenhum jogador cadastrado</p>
            <Button variant="outline" className="mt-4" onClick={openNew}><Plus className="w-4 h-4 mr-2" />Criar primeiro personagem</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {players.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
              <Card className="card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    {p.image ? (
                      <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0 ring-2 ring-primary/20"><img src={p.image} alt={p.name} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shrink-0 ring-2 ring-border"><User className="w-8 h-8 text-muted-foreground/30" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-display font-bold truncate">{p.name || 'Sem nome'}</h3>
                      {p.playerName && <p className="text-xs text-muted-foreground">Jogador: {p.playerName}</p>}
                      <p className="text-sm text-muted-foreground">{[p.race, p.className, p.profession].filter(Boolean).join(' • ')}{p.level > 0 && ` • Nv ${p.level}`}</p>
                      {p.experience > 0 && <p className="text-xs text-muted-foreground">XP: {p.experience.toLocaleString()}</p>}
                      <div className="flex flex-wrap gap-3 mt-2">
                        <div className="flex items-center gap-1"><Heart className="w-4 h-4 text-accent" /><span className="text-sm font-semibold">{p.hp}/{p.maxHp}</span></div>
                        {p.maxMana > 0 && <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold">{p.mana}/{p.maxMana}</span></div>}
                        {p.maxEnergy > 0 && <div className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-yellow-400" /><span className="text-sm font-semibold">{p.energy}/{p.maxEnergy}</span></div>}
                        <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">{p.ca}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                      {expandedId === p.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      {expandedId === p.id ? 'Recolher' : 'Expandir ficha'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {expandedId === p.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Separator />
                        <div className="p-4 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Swords className="w-3.5 h-3.5" />Atributos</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {allAttributes(p).map(a => (
                                <div key={a.name} className="text-center p-2.5 rounded-lg bg-secondary/50 border border-border/30">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{a.name.substring(0, 3)}</p>
                                  <p className="text-xl font-bold">{a.value}</p>
                                  <p className={`text-xs font-bold ${a.manualModifier ? 'text-accent' : 'text-primary'}`}>{modStr(a.modifier)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {allSkills(p).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Perícias</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {allSkills(p).map(s => (
                                  <Badge key={s.name} variant={s.proficient ? 'default' : 'outline'} className="text-xs gap-1">
                                    {s.name} <span className="font-bold">{modStr(s.bonus)}</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {p.inventory && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Backpack className="w-3.5 h-3.5" />Inventário</h4>
                              <p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{p.inventory}</p>
                            </div>
                          )}

                          {p.abilities && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Habilidades e Talentos</h4>
                              <p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{p.abilities}</p>
                            </div>
                          )}

                          {p.notes && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Anotações</h4>
                              <p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{p.notes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Separator />
                  <div className="flex gap-2 p-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="flex-1 gap-1"><Edit className="w-3 h-3" />Editar</Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => duplicate(p)}><Copy className="w-3 h-3" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Duplicar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="outline" size="sm" onClick={() => remove(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl">{editing && players.find(p => p.id === editing.id) ? 'Editar' : 'Novo'} Jogador</DialogTitle></DialogHeader>
          {editing && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="skills">Perícias</TabsTrigger>
                <TabsTrigger value="combat">Combate</TabsTrigger>
                <TabsTrigger value="other">Outros</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-3 mt-3">
                <Input placeholder="Nome do Personagem" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                <Input placeholder="Nome do Jogador" value={editing.playerName} onChange={e => setEditing({ ...editing, playerName: e.target.value })} />
                <Input placeholder="Raça" value={editing.race} onChange={e => setEditing({ ...editing, race: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Classe" value={editing.className} onChange={e => setEditing({ ...editing, className: e.target.value })} />
                  <Input placeholder="Profissão" value={editing.profession} onChange={e => setEditing({ ...editing, profession: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">Nível</label><Input type="number" min={1} value={editing.level} onChange={e => setEditing({ ...editing, level: parseInt(e.target.value) || 1 })} /></div>
                  <div><label className="text-xs text-muted-foreground">Experiência</label><Input type="number" min={0} value={editing.experience} onChange={e => setEditing({ ...editing, experience: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <Input placeholder="URL da Imagem" value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })} />
              </TabsContent>

              <TabsContent value="attributes" className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Edite valor e modificador. Modificadores manuais ficam em <span className="text-accent">destaque</span>.</p>
                </div>
                <div className="space-y-2">
                  {editing.attributes.map((a, i) => (
                    <AttrEditor key={a.name} a={a} i={i} />
                  ))}
                </div>

                {editing.customAttributes.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground font-semibold">Atributos customizados</p>
                    <div className="space-y-2">
                      {editing.customAttributes.map((a, i) => (
                        <AttrEditor key={`${a.name}-${i}`} a={a} i={i} custom />
                      ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Input placeholder="Nome do novo atributo" value={newAttrName} onChange={e => setNewAttrName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomAttr()} />
                  <Button variant="outline" size="sm" onClick={addCustomAttr}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">Clique no nome para alternar proficiência. Edite o bônus livremente.</p>
                <div className="space-y-2">
                  {editing.skills.map((s, i) => (
                    <SkillEditor key={s.name} s={s} i={i} />
                  ))}
                </div>

                {editing.customSkills.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground font-semibold">Perícias customizadas</p>
                    <div className="space-y-2">
                      {editing.customSkills.map((s, i) => (
                        <SkillEditor key={`${s.name}-${i}`} s={s} i={i} custom />
                      ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Input placeholder="Nome da perícia" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} className="flex-1" />
                  <Input placeholder="Atributo" value={newSkillAttr} onChange={e => setNewSkillAttr(e.target.value)} className="w-28" />
                  <Button variant="outline" size="sm" onClick={addCustomSkill}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="combat" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">HP Atual</label><Input type="number" value={editing.hp} onChange={e => setEditing({ ...editing, hp: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="text-xs text-muted-foreground">HP Máximo</label><Input type="number" value={editing.maxHp} onChange={e => setEditing({ ...editing, maxHp: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">Mana Atual</label><Input type="number" value={editing.mana} onChange={e => setEditing({ ...editing, mana: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="text-xs text-muted-foreground">Mana Máxima</label><Input type="number" value={editing.maxMana} onChange={e => setEditing({ ...editing, maxMana: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">Energia Atual</label><Input type="number" value={editing.energy} onChange={e => setEditing({ ...editing, energy: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="text-xs text-muted-foreground">Energia Máxima</label><Input type="number" value={editing.maxEnergy} onChange={e => setEditing({ ...editing, maxEnergy: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">CA (Classe de Armadura)</label><Input type="number" value={editing.ca} onChange={e => setEditing({ ...editing, ca: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="text-xs text-muted-foreground">Deslocamento (m)</label><Input type="number" value={editing.movement} onChange={e => setEditing({ ...editing, movement: parseInt(e.target.value) || 0 })} /></div>
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Backpack className="w-3 h-3" />Inventário</label>
                  <Textarea placeholder="Espada longa, escudo de madeira, poção de cura x3..." rows={4} value={editing.inventory} onChange={e => setEditing({ ...editing, inventory: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" />Habilidades, Magias e Talentos</label>
                  <Textarea placeholder="Ataque Extra, Ação Ardilosa, Bola de Fogo..." rows={4} value={editing.abilities} onChange={e => setEditing({ ...editing, abilities: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Anotações</label>
                  <Textarea placeholder="Notas gerais sobre o personagem..." rows={4} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
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

export default Players;
