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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Skull, Shield, Heart, Zap, Swords, BookOpen, X, ChevronDown, ChevronUp, RotateCcw, Copy, FileText, Save, FolderOpen, Gamepad2, Minus } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';
import { MONSTER_SYSTEM_PRESETS } from '@/data/rpgSystemPresets';
import { ImageUploader } from '@/components/ImageUploader';
import { StatusConditions } from '@/components/StatusConditions';
import { HPBar } from '@/components/HPBar';

interface Attribute {
  name: string;
  value: number;
  modifier: number;
  manualModifier: boolean;
}

interface MonsterCombatFields {
  hp: boolean;
  ca: boolean;
  movement: boolean;
}

interface MonsterSections {
  skills: boolean;
  attacks: boolean;
  abilities: boolean;
  resistances: boolean;
  immunities: boolean;
  senses: boolean;
  languages: boolean;
  inventory: boolean;
  notes: boolean;
}

interface MonsterTemplate {
  id: string;
  name: string;
  attributes: { name: string }[];
  combatFields: MonsterCombatFields;
  sections: MonsterSections;
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
  tempHp: number;
  ca: number;
  movement: number;
  conditions: string[];
  attributes: Attribute[];
  skills: string;
  attacks: string;
  abilities: string;
  resistances: string;
  immunities: string;
  senses: string;
  languages: string;
  inventory: string;
  notes: string;
  combatFields?: MonsterCombatFields;
  sections?: MonsterSections;
}

const DEFAULT_ATTRIBUTES: { name: string }[] = [
  { name: 'Força' }, { name: 'Destreza' }, { name: 'Constituição' },
  { name: 'Intuição' }, { name: 'Sabedoria' }, { name: 'Carisma' },
];

const DEFAULT_COMBAT: MonsterCombatFields = { hp: true, ca: true, movement: true };
const DEFAULT_SECTIONS: MonsterSections = { skills: true, attacks: true, abilities: true, resistances: true, immunities: true, senses: true, languages: true, inventory: true, notes: true };

const ATTACK_SUGGESTIONS = [
  'Mordida +5, 2d6+3 perfurante', 'Garras +4, 1d8+2 cortante', 'Cauda +3, 1d10+1 contundente',
  'Sopro de Fogo (CD 13), 4d6 fogo', 'Sopro Gélido (CD 12), 3d8 gelo', 'Teia (CD 11), restringido',
  'Investida +6, 2d8+4 contundente', 'Ferrão +5, 1d4+3 perfurante + 2d6 veneno',
  'Raio Ocular (CD 14), 3d10 necrótico', 'Esmagamento +7, 2d10+5 contundente',
];

const ABILITY_SUGGESTIONS = [
  'Visão no Escuro 18m', 'Resistência a Magia', 'Regeneração 5 HP/turno', 'Imunidade a Veneno',
  'Voo 12m', 'Faro Aguçado', 'Camuflagem (vantagem em furtividade)',
  'Resistência a Dano Não-mágico', 'Aura de Medo (CD 12)', 'Sentido Sísmico 9m',
];

const calcModifier = (value: number) => Math.floor((value - 10) / 2);
const modStr = (m: number) => m >= 0 ? `+${m}` : `${m}`;

const makeAttrs = (defs: { name: string }[]): Attribute[] =>
  defs.map(d => ({ name: d.name, value: 10, modifier: 0, manualModifier: false }));

const defaultTemplate = (): MonsterTemplate => ({
  id: 'default', name: 'Padrão',
  attributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
  combatFields: { ...DEFAULT_COMBAT },
  sections: { ...DEFAULT_SECTIONS },
});

const emptyMonster = (template?: MonsterTemplate): Monster => {
  const t = template || defaultTemplate();
  return {
    id: crypto.randomUUID(),
    name: '', type: '', size: 'Médio', alignment: '', challengeRating: '', image: '',
    hp: 10, maxHp: 10, tempHp: 0, ca: 10, movement: 9,
    conditions: [],
    attributes: makeAttrs(t.attributes),
    skills: '', attacks: '', abilities: '', resistances: '', immunities: '', senses: '', languages: '', inventory: '', notes: '',
    combatFields: { ...t.combatFields },
    sections: { ...t.sections },
  };
};

const Monsters = () => {
  const [monsters, setMonsters] = useLocalStorage<Monster[]>('arcanum-monsters', []);
  const [templates, setTemplates] = useLocalStorage<MonsterTemplate[]>('arcanum-monster-templates', []);
  const [editing, setEditing] = useState<Monster | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAttrName, setNewAttrName] = useState('');

  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MonsterTemplate | null>(null);
  const [tNewAttr, setTNewAttr] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = () => {
    if (!editing?.name.trim()) return;
    const updated = {
      ...editing,
      attributes: editing.attributes.map(a => ({
        ...a, modifier: a.manualModifier ? a.modifier : calcModifier(a.value),
      })),
    };
    setMonsters(prev => {
      const exists = prev.find(m => m.id === updated.id);
      return exists ? prev.map(m => m.id === updated.id ? updated : m) : [...prev, updated];
    });
    setOpen(false); setEditing(null);
  };

  const remove = (id: string) => setMonsters(prev => prev.filter(m => m.id !== id));

  const updateMonsterField = (id: string, field: keyof Monster, value: number) => {
    setMonsters(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const duplicate = (m: Monster) => {
    const dup = { ...m, id: crypto.randomUUID(), name: `${m.name} (cópia)`, attributes: m.attributes.map(a => ({ ...a })) };
    setMonsters(prev => [...prev, dup]);
  };

  const openNewWithTemplate = (t?: MonsterTemplate) => {
    setEditing(emptyMonster(t)); setPickerOpen(false); setOpen(true);
  };

  const openEdit = (m: Monster) => {
    setEditing({
      ...m,
      attributes: m.attributes?.map(a => ({ ...a, manualModifier: a.manualModifier ?? false })) || makeAttrs(DEFAULT_ATTRIBUTES),
      combatFields: m.combatFields || { ...DEFAULT_COMBAT },
      sections: m.sections || { ...DEFAULT_SECTIONS },
    });
    setOpen(true);
  };

  const setAttrValue = (i: number, val: number) => {
    if (!editing) return;
    const arr = [...editing.attributes]; const a = arr[i];
    arr[i] = { ...a, value: val, modifier: a.manualModifier ? a.modifier : calcModifier(val) };
    setEditing({ ...editing, attributes: arr });
  };
  const setAttrModifier = (i: number, mod: number) => {
    if (!editing) return;
    const arr = [...editing.attributes];
    arr[i] = { ...arr[i], modifier: mod, manualModifier: true };
    setEditing({ ...editing, attributes: arr });
  };
  const resetModifier = (i: number) => {
    if (!editing) return;
    const arr = [...editing.attributes];
    arr[i] = { ...arr[i], modifier: calcModifier(arr[i].value), manualModifier: false };
    setEditing({ ...editing, attributes: arr });
  };
  const removeAttr = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, attributes: editing.attributes.filter((_, j) => j !== i) });
  };
  const addAttr = () => {
    if (!editing || !newAttrName.trim()) return;
    setEditing({ ...editing, attributes: [...editing.attributes, { name: newAttrName.trim(), value: 10, modifier: 0, manualModifier: false }] });
    setNewAttrName('');
  };

  const addAttack = (a: string) => { if (!editing) return; const c = editing.attacks.trim(); setEditing({ ...editing, attacks: c ? `${c}\n${a}` : a }); };
  const addAbility = (a: string) => { if (!editing) return; const c = editing.abilities.trim(); setEditing({ ...editing, abilities: c ? `${c}\n${a}` : a }); };

  // Template helpers
  const openNewTemplate = () => {
    setEditingTemplate({ id: crypto.randomUUID(), name: '', attributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a })), combatFields: { ...DEFAULT_COMBAT }, sections: { ...DEFAULT_SECTIONS } });
    setTemplateOpen(true);
  };
  const openEditTemplate = (t: MonsterTemplate) => {
    setEditingTemplate({ ...t, attributes: t.attributes.map(a => ({ ...a })), combatFields: { ...t.combatFields }, sections: { ...t.sections } });
    setTemplateOpen(true);
  };
  const saveTemplate = () => {
    if (!editingTemplate?.name.trim()) return;
    setTemplates(prev => {
      const exists = prev.find(t => t.id === editingTemplate.id);
      return exists ? prev.map(t => t.id === editingTemplate.id ? editingTemplate : t) : [...prev, editingTemplate];
    });
    setTemplateOpen(false); setEditingTemplate(null);
  };
  const removeTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

  const sec = editing?.sections || DEFAULT_SECTIONS;
  const cf = editing?.combatFields || DEFAULT_COMBAT;

  const AttrEditor = ({ a, i }: { a: Attribute; i: number }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
      <span className="text-sm font-semibold w-24 truncate">{a.name}</span>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[10px] text-muted-foreground">Valor</label>
        <NumberInput className="w-16 h-8 text-center text-sm" value={a.value} onChange={v => setAttrValue(i, v)} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[10px] text-muted-foreground">Mod</label>
        <div className="flex items-center gap-1">
          <NumberInput className={`w-16 h-8 text-center text-sm ${a.manualModifier ? 'border-primary/50 bg-primary/5' : ''}`} value={a.modifier} onChange={v => setAttrModifier(i, v)} />
          {a.manualModifier && (
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0.5 h-auto" onClick={() => resetModifier(i)}><RotateCcw className="w-3 h-3 text-muted-foreground" /></Button>
            </TooltipTrigger><TooltipContent><p className="text-xs">Restaurar ({modStr(calcModifier(a.value))})</p></TooltipContent></Tooltip></TooltipProvider>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="p-1 h-auto ml-auto text-muted-foreground hover:text-destructive" onClick={() => removeAttr(i)}><X className="w-3 h-3" /></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-title">Monstros</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewTemplate} className="gap-2"><FileText className="w-4 h-4" />Adicionar Modelo</Button>
          <Button onClick={() => setPickerOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Adicionar</Button>
        </div>
      </div>

      {templates.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><FolderOpen className="w-3 h-3" />Modelos salvos</p>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-1">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 gap-1" onClick={() => openEditTemplate(t)}><Edit className="w-3 h-3" />{t.name}</Badge>
                  <Button variant="ghost" size="sm" className="p-0.5 h-auto text-muted-foreground hover:text-destructive" onClick={() => removeTemplate(t.id)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {monsters.length === 0 && (
        <Card className="card-hover glow-border">
          <CardContent className="p-12 text-center">
            <Skull className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">Nenhum monstro cadastrado</p>
            <Button variant="outline" className="mt-4" onClick={() => setPickerOpen(true)}><Plus className="w-4 h-4 mr-2" />Criar primeiro monstro</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {monsters.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
              <Card className="card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    {m.image ? (
                      <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0 ring-2 ring-primary/20"><img src={m.image} alt={m.name} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shrink-0 ring-2 ring-border"><Skull className="w-8 h-8 text-muted-foreground/30" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-display font-bold truncate">{m.name || 'Sem nome'}</h3>
                      <p className="text-sm text-muted-foreground">{[m.size, m.type, m.alignment].filter(Boolean).join(' • ') || 'Sem tipo'}{m.challengeRating && ` • ND ${m.challengeRating}`}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                          <Heart className="w-3.5 h-3.5 text-accent shrink-0" />
                          <button className="text-xs text-muted-foreground hover:text-accent transition-colors" onClick={(e) => { e.stopPropagation(); updateMonsterField(m.id, 'hp', Math.max(0, m.hp - 1)); }}><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-semibold min-w-[3ch] text-center">{m.hp}</span>
                          <button className="text-xs text-muted-foreground hover:text-accent transition-colors" onClick={(e) => { e.stopPropagation(); updateMonsterField(m.id, 'hp', Math.min(m.maxHp, m.hp + 1)); }}><Plus className="w-3 h-3" /></button>
                          <span className="text-xs text-muted-foreground">/{m.maxHp || m.hp}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-sm font-semibold">{m.ca}</span>
                        </div>
                        {m.movement > 0 && (
                          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                            <span className="text-sm text-muted-foreground">{m.movement}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                      {expandedId === m.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      {expandedId === m.id ? 'Recolher' : 'Expandir ficha'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {expandedId === m.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Separator />
                        <div className="p-4 space-y-4">
                          {m.attributes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Swords className="w-3.5 h-3.5" />Atributos</h4>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {m.attributes.map(a => (
                                  <div key={a.name} className="text-center p-2.5 rounded-lg bg-secondary/50 border border-border/30">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{a.name.substring(0, 3)}</p>
                                    <p className="text-xl font-bold">{a.value}</p>
                                    <p className={`text-xs font-bold ${a.manualModifier ? 'text-accent' : 'text-primary'}`}>{modStr(a.modifier)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {m.skills && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Perícias</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.skills}</p></div>}
                          {m.attacks && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Ataques</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.attacks}</p></div>}
                          {m.abilities && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Habilidades</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.abilities}</p></div>}
                          {m.resistances && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Resistências</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.resistances}</p></div>}
                          {m.immunities && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Imunidades</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.immunities}</p></div>}
                          {m.senses && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Sentidos</h4><p className="text-sm bg-secondary/30 rounded-lg p-3 border border-border/30">{m.senses}</p></div>}
                          {m.languages && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Idiomas</h4><p className="text-sm bg-secondary/30 rounded-lg p-3 border border-border/30">{m.languages}</p></div>}
                          {m.inventory && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Tesouro / Inventário</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.inventory}</p></div>}
                          {m.notes && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Anotações</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{m.notes}</p></div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Separator />
                  <div className="flex gap-2 p-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="flex-1 gap-1"><Edit className="w-3 h-3" />Editar</Button>
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => duplicate(m)}><Copy className="w-3 h-3" /></Button>
                    </TooltipTrigger><TooltipContent><p className="text-xs">Duplicar</p></TooltipContent></Tooltip></TooltipProvider>
                    <Button variant="outline" size="sm" onClick={() => remove(m.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TEMPLATE PICKER */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Escolher Modelo</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Gamepad2 className="w-3 h-3" />Sistemas de RPG</p>
            {MONSTER_SYSTEM_PRESETS.map(preset => (
              <Button key={preset.id} variant="outline" className="w-full justify-start gap-2" onClick={() => openNewWithTemplate({
                id: preset.id, name: preset.name,
                attributes: preset.attributes.map(a => ({ ...a })),
                combatFields: { ...preset.combatFields },
                sections: { ...preset.sections },
              })}>
                <Gamepad2 className="w-4 h-4 text-primary" />{preset.name}
                <span className="text-xs text-muted-foreground ml-auto">{preset.attributes.length} atr</span>
              </Button>
            ))}
            <Separator />
            <p className="text-xs text-muted-foreground flex items-center gap-1"><FolderOpen className="w-3 h-3" />Outros</p>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => openNewWithTemplate()}>
              <FileText className="w-4 h-4" />Ficha padrão (sem modelo)
            </Button>
            {templates.map(t => (
              <Button key={t.id} variant="outline" className="w-full justify-start gap-2" onClick={() => openNewWithTemplate(t)}>
                <FolderOpen className="w-4 h-4" />{t.name}
                <span className="text-xs text-muted-foreground ml-auto">{t.attributes.length} atr</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* TEMPLATE EDITOR */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingTemplate && templates.find(t => t.id === editingTemplate.id) ? 'Editar' : 'Novo'} Modelo de Monstro</DialogTitle></DialogHeader>
          {editingTemplate && (
            <Tabs defaultValue="t-info" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="t-info">Geral</TabsTrigger>
                <TabsTrigger value="t-attrs">Atributos</TabsTrigger>
                <TabsTrigger value="t-sections">Seções</TabsTrigger>
              </TabsList>

              <TabsContent value="t-info" className="space-y-3 mt-3">
                <Input placeholder="Nome do modelo (ex: Boss Dragão)" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} />
                <p className="text-xs text-muted-foreground">Configure a estrutura do modelo. Ao criar um monstro com este modelo, ele virá com os atributos e seções definidos.</p>
              </TabsContent>

              <TabsContent value="t-attrs" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">Defina quais atributos o modelo terá.</p>
                <div className="space-y-1.5">
                  {editingTemplate.attributes.map((a, i) => (
                    <div key={`${a.name}-${i}`} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
                      <span className="text-sm font-semibold">{a.name}</span>
                      <Button variant="ghost" size="sm" className="p-1 h-auto text-muted-foreground hover:text-destructive" onClick={() => setEditingTemplate({ ...editingTemplate, attributes: editingTemplate.attributes.filter((_, j) => j !== i) })}><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Novo atributo" value={tNewAttr} onChange={e => setTNewAttr(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && tNewAttr.trim()) { setEditingTemplate({ ...editingTemplate, attributes: [...editingTemplate.attributes, { name: tNewAttr.trim() }] }); setTNewAttr(''); }
                  }} />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (!tNewAttr.trim()) return;
                    setEditingTemplate({ ...editingTemplate, attributes: [...editingTemplate.attributes, { name: tNewAttr.trim() }] }); setTNewAttr('');
                  }}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="t-sections" className="space-y-4 mt-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Combate</h4>
                  {([['hp', 'Pontos de Vida (HP)'], ['ca', 'Classe de Armadura (CA)'], ['movement', 'Deslocamento']] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer">
                      <Checkbox checked={editingTemplate.combatFields[key]} onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, combatFields: { ...editingTemplate.combatFields, [key]: !!v } })} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Seções de dados</h4>
                  {([['skills', 'Perícias'], ['attacks', 'Ataques'], ['abilities', 'Habilidades'], ['resistances', 'Resistências'], ['immunities', 'Imunidades'], ['senses', 'Sentidos'], ['languages', 'Idiomas'], ['inventory', 'Tesouro/Inventário'], ['notes', 'Anotações']] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer">
                      <Checkbox checked={editingTemplate.sections[key]} onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, sections: { ...editingTemplate.sections, [key]: !!v } })} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </TabsContent>

              <Button onClick={saveTemplate} className="w-full mt-4 gap-2"><Save className="w-4 h-4" />Salvar Modelo</Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MONSTER DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl">{editing && monsters.find(m => m.id === editing.id) ? 'Editar' : 'Novo'} Monstro</DialogTitle></DialogHeader>
          {editing && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="combat">Combate</TabsTrigger>
                <TabsTrigger value="other">Outros</TabsTrigger>
              </TabsList>

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

              <TabsContent value="attributes" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">Edite, remova ou adicione atributos. Modificadores manuais ficam em <span className="text-accent">destaque</span>.</p>
                <div className="space-y-2">
                  {editing.attributes.map((a, i) => (
                    <AttrEditor key={`${a.name}-${i}`} a={a} i={i} />
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Input placeholder="Nome do novo atributo" value={newAttrName} onChange={e => setNewAttrName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttr()} />
                  <Button variant="outline" size="sm" onClick={addAttr}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="combat" className="space-y-3 mt-3">
                {cf.hp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted-foreground">HP</label><NumberInput value={editing.hp} onChange={v => setEditing({ ...editing, hp: v })} /></div>
                    <div><label className="text-xs text-muted-foreground">HP Máximo</label><NumberInput value={editing.maxHp} onChange={v => setEditing({ ...editing, maxHp: v })} /></div>
                  </div>
                )}
                {(cf.ca || cf.movement) && (
                  <div className="grid grid-cols-2 gap-3">
                    {cf.ca && <div><label className="text-xs text-muted-foreground">CA</label><NumberInput value={editing.ca} onChange={v => setEditing({ ...editing, ca: v })} /></div>}
                    {cf.movement && <div><label className="text-xs text-muted-foreground">Deslocamento (m)</label><NumberInput value={editing.movement} onChange={v => setEditing({ ...editing, movement: v })} /></div>}
                  </div>
                )}

                {sec.attacks && (
                  <div>
                    <Textarea placeholder="Ataques (ex: Mordida +5, 2d6+3)" value={editing.attacks} onChange={e => setEditing({ ...editing, attacks: e.target.value })} rows={3} />
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" />Sugestões:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ATTACK_SUGGESTIONS.map(a => (
                          <Badge key={a} variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors text-xs" onClick={() => addAttack(a)}>
                            {a.split(',')[0]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {sec.resistances && <Textarea placeholder="Resistências" value={editing.resistances} onChange={e => setEditing({ ...editing, resistances: e.target.value })} rows={2} />}
                {sec.immunities && <Textarea placeholder="Imunidades" value={editing.immunities} onChange={e => setEditing({ ...editing, immunities: e.target.value })} rows={2} />}
              </TabsContent>

              <TabsContent value="other" className="space-y-3 mt-3">
                {sec.skills && (
                  <div><label className="text-xs text-muted-foreground mb-1 block">Perícias</label>
                    <Textarea placeholder="Percepção +5, Furtividade +4..." value={editing.skills} onChange={e => setEditing({ ...editing, skills: e.target.value })} rows={2} />
                  </div>
                )}
                {sec.abilities && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Habilidades Especiais</label>
                    <Textarea placeholder="Habilidades especiais" value={editing.abilities} onChange={e => setEditing({ ...editing, abilities: e.target.value })} rows={3} />
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1.5">Sugestões:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ABILITY_SUGGESTIONS.map(a => (
                          <Badge key={a} variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors text-xs" onClick={() => addAbility(a)}>{a}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {sec.senses && <div><label className="text-xs text-muted-foreground mb-1 block">Sentidos</label><Input placeholder="Visão no escuro 18m" value={editing.senses} onChange={e => setEditing({ ...editing, senses: e.target.value })} /></div>}
                {sec.languages && <div><label className="text-xs text-muted-foreground mb-1 block">Idiomas</label><Input placeholder="Comum, Dracônico" value={editing.languages} onChange={e => setEditing({ ...editing, languages: e.target.value })} /></div>}
                {sec.inventory && <div><label className="text-xs text-muted-foreground mb-1 block">Tesouro / Inventário</label><Textarea placeholder="Itens que o monstro carrega..." rows={3} value={editing.inventory} onChange={e => setEditing({ ...editing, inventory: e.target.value })} /></div>}
                {sec.notes && <div><label className="text-xs text-muted-foreground mb-1 block">Anotações</label><Textarea placeholder="Notas gerais..." rows={3} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>}
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
