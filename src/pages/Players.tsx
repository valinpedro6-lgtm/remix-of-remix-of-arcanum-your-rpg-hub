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
import { Plus, Trash2, Edit, Shield, Heart, User, Zap, Swords, BookOpen, Backpack, Sparkles, X, ChevronDown, ChevronUp, RotateCcw, Copy, FileText, Save, FolderOpen, Gamepad2, Minus } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_SYSTEM_PRESETS } from '@/data/rpgSystemPresets';
import { ImageUploader } from '@/components/ImageUploader';
import { StatusConditions } from '@/components/StatusConditions';
import { HPBar } from '@/components/HPBar';

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

interface CombatFields {
  hp: boolean;
  mana: boolean;
  energy: boolean;
  ca: boolean;
  movement: boolean;
}

interface SheetTemplate {
  id: string;
  name: string;
  attributes: { name: string }[];
  skills: { name: string; attribute: string }[];
  combatFields: CombatFields;
  hasInventory: boolean;
  hasAbilities: boolean;
  hasNotes: boolean;
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
  tempHp: number;
  mana: number;
  maxMana: number;
  energy: number;
  maxEnergy: number;
  ca: number;
  movement: number;
  proficiencyBonus: number;
  conditions: string[];
  attributes: Attribute[];
  skills: Skill[];
  inventory: string;
  abilities: string;
  notes: string;
  combatFields?: CombatFields;
  hasInventory?: boolean;
  hasAbilities?: boolean;
  hasNotes?: boolean;
}

const DEFAULT_ATTRIBUTES: { name: string }[] = [
  { name: 'Força' },
  { name: 'Destreza' },
  { name: 'Constituição' },
  { name: 'Intuição' },
  { name: 'Sabedoria' },
  { name: 'Carisma' },
];

const DEFAULT_SKILLS: { name: string; attribute: string }[] = [
  { name: 'Acrobacia', attribute: 'Destreza' },
  { name: 'Arcanismo', attribute: 'Intuição' },
  { name: 'Atletismo', attribute: 'Força' },
  { name: 'Furtividade', attribute: 'Destreza' },
  { name: 'Intimidação', attribute: 'Carisma' },
  { name: 'Investigação', attribute: 'Intuição' },
  { name: 'Medicina', attribute: 'Sabedoria' },
  { name: 'Percepção', attribute: 'Sabedoria' },
  { name: 'Persuasão', attribute: 'Carisma' },
  { name: 'Sobrevivência', attribute: 'Sabedoria' },
];

const DEFAULT_COMBAT: CombatFields = { hp: true, mana: true, energy: true, ca: true, movement: true };

const calcModifier = (value: number) => Math.floor((value - 10) / 2);
const modStr = (m: number) => m >= 0 ? `+${m}` : `${m}`;

const makeAttrs = (defs: { name: string }[]): Attribute[] =>
  defs.map(d => ({ name: d.name, value: 10, modifier: 0, manualModifier: false }));

const makeSkills = (defs: { name: string; attribute: string }[]): Skill[] =>
  defs.map(d => ({ name: d.name, bonus: 0, proficient: false, attribute: d.attribute }));

const defaultTemplate = (): SheetTemplate => ({
  id: 'default',
  name: 'Padrão (D&D / Universal)',
  attributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
  skills: DEFAULT_SKILLS.map(s => ({ ...s })),
  combatFields: { ...DEFAULT_COMBAT },
  hasInventory: true,
  hasAbilities: true,
  hasNotes: true,
});

const emptyPlayer = (template?: SheetTemplate): Player => {
  const t = template || defaultTemplate();
  return {
    id: crypto.randomUUID(),
    name: '', playerName: '', race: '', className: '', profession: '', level: 1, experience: 0, image: '',
    hp: 10, maxHp: 10, tempHp: 0, mana: 0, maxMana: 0, energy: 10, maxEnergy: 10, ca: 10, movement: 9, proficiencyBonus: 2,
    conditions: [],
    attributes: makeAttrs(t.attributes),
    skills: makeSkills(t.skills),
    inventory: '', abilities: '', notes: '',
    combatFields: { ...t.combatFields },
    hasInventory: t.hasInventory,
    hasAbilities: t.hasAbilities,
    hasNotes: t.hasNotes,
  };
};

const Players = () => {
  const [players, setPlayers] = useLocalStorage<Player[]>('arcanum-players', []);
  const [templates, setTemplates] = useLocalStorage<SheetTemplate[]>('arcanum-player-templates', []);
  const [editing, setEditing] = useState<Player | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAttrName, setNewAttrName] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAttr, setNewSkillAttr] = useState('');

  // Template editor state
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SheetTemplate | null>(null);
  const [tNewAttr, setTNewAttr] = useState('');
  const [tNewSkill, setTNewSkill] = useState('');
  const [tNewSkillAttr, setTNewSkillAttr] = useState('');

  // New player template picker
  const [pickerOpen, setPickerOpen] = useState(false);

  // Helper to calculate skill bonus from attribute + proficiency
  const calcSkillBonus = (skill: Skill, attributes: Attribute[], profBonus: number): number => {
    const attr = attributes.find(a => a.name === skill.attribute);
    const attrMod = attr ? (attr.manualModifier ? attr.modifier : calcModifier(attr.value)) : 0;
    return skill.proficient ? attrMod + profBonus : attrMod;
  };

  const save = () => {
    if (!editing?.name.trim()) return;
    const updatedAttrs = editing.attributes.map(a => ({
      ...a,
      modifier: a.manualModifier ? a.modifier : calcModifier(a.value),
    }));
    const profBonus = editing.proficiencyBonus ?? 2;
    const updatedSkills = editing.skills.map(s => ({
      ...s,
      bonus: calcSkillBonus(s, updatedAttrs, profBonus),
    }));
    const updated = { ...editing, attributes: updatedAttrs, skills: updatedSkills };
    setPlayers(prev => {
      const exists = prev.find(p => p.id === updated.id);
      return exists ? prev.map(p => p.id === updated.id ? updated : p) : [...prev, updated];
    });
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));

  const duplicate = (p: Player) => {
    const dup = { ...p, id: crypto.randomUUID(), name: `${p.name} (cópia)`, attributes: p.attributes.map(a => ({ ...a })), skills: p.skills.map(s => ({ ...s })) };
    setPlayers(prev => [...prev, dup]);
  };

  const updatePlayerField = (id: string, field: keyof Player, value: number) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const openNewWithTemplate = (t?: SheetTemplate) => {
    setEditing(emptyPlayer(t));
    setPickerOpen(false);
    setOpen(true);
  };

  const openEdit = (p: Player) => {
    setEditing({
      ...p,
      attributes: p.attributes?.map(a => ({ ...a, manualModifier: a.manualModifier ?? false })) || makeAttrs(DEFAULT_ATTRIBUTES),
      skills: p.skills?.map(s => ({ ...s })) || makeSkills(DEFAULT_SKILLS),
      proficiencyBonus: p.proficiencyBonus ?? 2,
      combatFields: p.combatFields || { ...DEFAULT_COMBAT },
      hasInventory: p.hasInventory ?? true,
      hasAbilities: p.hasAbilities ?? true,
      hasNotes: p.hasNotes ?? true,
    });
    setOpen(true);
  };

  // Attribute helpers
  const setAttrValue = (index: number, val: number) => {
    if (!editing) return;
    const arr = [...editing.attributes];
    const a = arr[index];
    arr[index] = { ...a, value: val, modifier: a.manualModifier ? a.modifier : calcModifier(val) };
    setEditing({ ...editing, attributes: arr });
  };

  const setAttrModifier = (index: number, mod: number) => {
    if (!editing) return;
    const arr = [...editing.attributes];
    arr[index] = { ...arr[index], modifier: mod, manualModifier: true };
    setEditing({ ...editing, attributes: arr });
  };

  const resetModifier = (index: number) => {
    if (!editing) return;
    const arr = [...editing.attributes];
    arr[index] = { ...arr[index], modifier: calcModifier(arr[index].value), manualModifier: false };
    setEditing({ ...editing, attributes: arr });
  };

  const removeAttr = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, attributes: editing.attributes.filter((_, i) => i !== index) });
  };

  const addAttr = () => {
    if (!editing || !newAttrName.trim()) return;
    setEditing({ ...editing, attributes: [...editing.attributes, { name: newAttrName.trim(), value: 10, modifier: 0, manualModifier: false }] });
    setNewAttrName('');
  };

  // Skill helpers
  const setSkill = (index: number, field: string, val: any) => {
    if (!editing) return;
    const arr = [...editing.skills];
    arr[index] = { ...arr[index], [field]: val };
    setEditing({ ...editing, skills: arr });
  };

  const removeSkill = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, skills: editing.skills.filter((_, i) => i !== index) });
  };

  const addSkill = () => {
    if (!editing || !newSkillName.trim()) return;
    setEditing({ ...editing, skills: [...editing.skills, { name: newSkillName.trim(), bonus: 0, proficient: false, attribute: newSkillAttr || 'Nenhum' }] });
    setNewSkillName('');
    setNewSkillAttr('');
  };

  // Template helpers
  const openNewTemplate = () => {
    setEditingTemplate({
      id: crypto.randomUUID(),
      name: '',
      attributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
      skills: DEFAULT_SKILLS.map(s => ({ ...s })),
      combatFields: { ...DEFAULT_COMBAT },
      hasInventory: true,
      hasAbilities: true,
      hasNotes: true,
    });
    setTemplateOpen(true);
  };

  const openEditTemplate = (t: SheetTemplate) => {
    setEditingTemplate({ ...t, attributes: t.attributes.map(a => ({ ...a })), skills: t.skills.map(s => ({ ...s })), combatFields: { ...t.combatFields } });
    setTemplateOpen(true);
  };

  const saveTemplate = () => {
    if (!editingTemplate?.name.trim()) return;
    setTemplates(prev => {
      const exists = prev.find(t => t.id === editingTemplate.id);
      return exists ? prev.map(t => t.id === editingTemplate.id ? editingTemplate : t) : [...prev, editingTemplate];
    });
    setTemplateOpen(false);
    setEditingTemplate(null);
  };

  const removeTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

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
          <NumberInput
            className={`w-16 h-8 text-center text-sm ${a.manualModifier ? 'border-primary/50 bg-primary/5' : ''}`}
            value={a.modifier}
            onChange={v => setAttrModifier(i, v)}
          />
          {a.manualModifier && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0.5 h-auto" onClick={() => resetModifier(i)}>
                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Restaurar ({modStr(calcModifier(a.value))})</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="p-1 h-auto ml-auto text-muted-foreground hover:text-destructive" onClick={() => removeAttr(i)}>
        <X className="w-3 h-3" />
      </Button>
    </div>
  );

  const SkillEditor = ({ s, i }: { s: Skill; i: number }) => {
    const autoBonus = editing ? calcSkillBonus(s, editing.attributes, editing.proficiencyBonus ?? 2) : s.bonus;
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
        <button
          className={`text-sm w-32 text-left truncate transition-colors ${s.proficient ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setSkill(i, 'proficient', !s.proficient)}
        >
          <span className={`inline-block w-4 ${s.proficient ? 'text-primary' : ''}`}>{s.proficient ? '●' : '○'}</span>
          {s.name}
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <label className="text-[10px] text-muted-foreground">Bônus</label>
          <span className={`w-16 h-8 flex items-center justify-center text-sm font-bold rounded-md border border-border/50 ${s.proficient ? 'text-primary bg-primary/5' : 'text-foreground bg-secondary/30'}`}>
            {modStr(autoBonus)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">{s.attribute}</span>
        {s.proficient && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">+{editing?.proficiencyBonus ?? 2} prof</span>
        )}
        <Button variant="ghost" size="sm" className="p-1 h-auto ml-auto text-muted-foreground hover:text-destructive" onClick={() => removeSkill(i)}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  const cf = editing?.combatFields || DEFAULT_COMBAT;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-title">Jogadores</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewTemplate} className="gap-2"><FileText className="w-4 h-4" />Adicionar Modelo</Button>
          <Button onClick={() => setPickerOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Adicionar</Button>
        </div>
      </div>

      {/* Templates bar */}
      {templates.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><FolderOpen className="w-3 h-3" />Modelos salvos</p>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-1">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 gap-1" onClick={() => openEditTemplate(t)}>
                    <Edit className="w-3 h-3" />{t.name}
                  </Badge>
                  <Button variant="ghost" size="sm" className="p-0.5 h-auto text-muted-foreground hover:text-destructive" onClick={() => removeTemplate(t.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {players.length === 0 && (
        <Card className="card-hover glow-border">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">Nenhum jogador cadastrado</p>
            <Button variant="outline" className="mt-4" onClick={() => setPickerOpen(true)}><Plus className="w-4 h-4 mr-2" />Criar primeiro personagem</Button>
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
                    <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                          <Heart className="w-3.5 h-3.5 text-accent shrink-0" />
                          <button className="text-xs text-muted-foreground hover:text-accent transition-colors" onClick={(e) => { e.stopPropagation(); updatePlayerField(p.id, 'hp', Math.max(0, p.hp - 1)); }}><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-semibold min-w-[3ch] text-center">{p.hp}</span>
                          <button className="text-xs text-muted-foreground hover:text-accent transition-colors" onClick={(e) => { e.stopPropagation(); updatePlayerField(p.id, 'hp', Math.min(p.maxHp, p.hp + 1)); }}><Plus className="w-3 h-3" /></button>
                          <span className="text-xs text-muted-foreground">/{p.maxHp}</span>
                        </div>
                        {p.maxMana > 0 && (
                          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                            <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <button className="text-xs text-muted-foreground hover:text-blue-400 transition-colors" onClick={(e) => { e.stopPropagation(); updatePlayerField(p.id, 'mana', Math.max(0, p.mana - 1)); }}><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-semibold min-w-[3ch] text-center">{p.mana}</span>
                            <button className="text-xs text-muted-foreground hover:text-blue-400 transition-colors" onClick={(e) => { e.stopPropagation(); updatePlayerField(p.id, 'mana', Math.min(p.maxMana, p.mana + 1)); }}><Plus className="w-3 h-3" /></button>
                            <span className="text-xs text-muted-foreground">/{p.maxMana}</span>
                          </div>
                        )}
                        {p.maxEnergy > 0 && (
                          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            <button className="text-xs text-muted-foreground hover:text-yellow-400 transition-colors" onClick={(e) => { e.stopPropagation(); updatePlayerField(p.id, 'energy', Math.max(0, p.energy - 1)); }}><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-semibold min-w-[3ch] text-center">{p.energy}</span>
                            <button className="text-xs text-muted-foreground hover:text-yellow-400 transition-colors" onClick={(e) => { e.stopPropagation(); updatePlayerField(p.id, 'energy', Math.min(p.maxEnergy, p.energy + 1)); }}><Plus className="w-3 h-3" /></button>
                            <span className="text-xs text-muted-foreground">/{p.maxEnergy}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-sm font-semibold">{p.ca}</span>
                        </div>
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
                          {p.attributes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Swords className="w-3.5 h-3.5" />Atributos</h4>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {p.attributes.map(a => (
                                  <div key={a.name} className="text-center p-2.5 rounded-lg bg-secondary/50 border border-border/30">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{a.name.substring(0, 3)}</p>
                                    <p className="text-xl font-bold">{a.value}</p>
                                    <p className={`text-xs font-bold ${a.manualModifier ? 'text-accent' : 'text-primary'}`}>{modStr(a.modifier)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {p.skills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Perícias</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {p.skills.map(s => (
                                  <Badge key={s.name} variant={s.proficient ? 'default' : 'outline'} className="text-xs gap-1">
                                    {s.name} <span className="font-bold">{modStr(s.bonus)}</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {p.inventory && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Backpack className="w-3.5 h-3.5" />Inventário</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{p.inventory}</p></div>}
                          {p.abilities && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Habilidades e Talentos</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{p.abilities}</p></div>}
                          {p.notes && <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Anotações</h4><p className="text-sm whitespace-pre-line bg-secondary/30 rounded-lg p-3 border border-border/30">{p.notes}</p></div>}
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

      {/* TEMPLATE PICKER */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl">Escolher Modelo</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Gamepad2 className="w-3 h-3" />Sistemas de RPG</p>
            {PLAYER_SYSTEM_PRESETS.map(preset => (
              <Button key={preset.id} variant="outline" className="w-full justify-start gap-2" onClick={() => openNewWithTemplate({
                id: preset.id, name: preset.name,
                attributes: preset.attributes.map(a => ({ ...a })),
                skills: preset.skills.map(s => ({ ...s })),
                combatFields: { ...preset.combatFields },
                hasInventory: preset.hasInventory, hasAbilities: preset.hasAbilities, hasNotes: preset.hasNotes,
              })}>
                <Gamepad2 className="w-4 h-4 text-primary" />{preset.name}
                <span className="text-xs text-muted-foreground ml-auto">{preset.attributes.length} atr · {preset.skills.length} per</span>
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
                <span className="text-xs text-muted-foreground ml-auto">{t.attributes.length} atr · {t.skills.length} per</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* TEMPLATE EDITOR */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingTemplate && templates.find(t => t.id === editingTemplate.id) ? 'Editar' : 'Novo'} Modelo de Ficha</DialogTitle></DialogHeader>
          {editingTemplate && (
            <Tabs defaultValue="t-info" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="t-info">Geral</TabsTrigger>
                <TabsTrigger value="t-attrs">Atributos</TabsTrigger>
                <TabsTrigger value="t-skills">Perícias</TabsTrigger>
                <TabsTrigger value="t-combat">Combate/Outros</TabsTrigger>
              </TabsList>

              <TabsContent value="t-info" className="space-y-3 mt-3">
                <Input placeholder="Nome do modelo (ex: Ficha Vampiro)" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} />
                <p className="text-xs text-muted-foreground">Configure quais atributos, perícias e campos de combate este modelo terá. Ao criar uma ficha com este modelo, ela já virá com a estrutura definida.</p>
              </TabsContent>

              <TabsContent value="t-attrs" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">Escolha quais atributos fazem parte deste modelo. Remova os que não quer e adicione novos.</p>
                <div className="space-y-1.5">
                  {editingTemplate.attributes.map((a, i) => (
                    <div key={`${a.name}-${i}`} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
                      <span className="text-sm font-semibold">{a.name}</span>
                      <Button variant="ghost" size="sm" className="p-1 h-auto text-muted-foreground hover:text-destructive" onClick={() => setEditingTemplate({ ...editingTemplate, attributes: editingTemplate.attributes.filter((_, j) => j !== i) })}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Novo atributo" value={tNewAttr} onChange={e => setTNewAttr(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && tNewAttr.trim()) {
                      setEditingTemplate({ ...editingTemplate, attributes: [...editingTemplate.attributes, { name: tNewAttr.trim() }] });
                      setTNewAttr('');
                    }
                  }} />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (!tNewAttr.trim()) return;
                    setEditingTemplate({ ...editingTemplate, attributes: [...editingTemplate.attributes, { name: tNewAttr.trim() }] });
                    setTNewAttr('');
                  }}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="t-skills" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">Defina as perícias do modelo.</p>
                <div className="space-y-1.5">
                  {editingTemplate.skills.map((s, i) => (
                    <div key={`${s.name}-${i}`} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
                      <div>
                        <span className="text-sm font-semibold">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">({s.attribute})</span>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1 h-auto text-muted-foreground hover:text-destructive" onClick={() => setEditingTemplate({ ...editingTemplate, skills: editingTemplate.skills.filter((_, j) => j !== i) })}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Nome da perícia" value={tNewSkill} onChange={e => setTNewSkill(e.target.value)} className="flex-1" />
                  <Input placeholder="Atributo" value={tNewSkillAttr} onChange={e => setTNewSkillAttr(e.target.value)} className="w-28" />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (!tNewSkill.trim()) return;
                    setEditingTemplate({ ...editingTemplate, skills: [...editingTemplate.skills, { name: tNewSkill.trim(), attribute: tNewSkillAttr || 'Nenhum' }] });
                    setTNewSkill('');
                    setTNewSkillAttr('');
                  }}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="t-combat" className="space-y-4 mt-3">
                <p className="text-xs text-muted-foreground">Escolha quais campos de combate e seções adicionais o modelo terá.</p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Campos de Combate</h4>
                  {([['hp', 'Pontos de Vida (HP)'], ['mana', 'Mana'], ['energy', 'Energia'], ['ca', 'Classe de Armadura (CA)'], ['movement', 'Deslocamento']] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer">
                      <Checkbox checked={editingTemplate.combatFields[key]} onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, combatFields: { ...editingTemplate.combatFields, [key]: !!v } })} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Seções adicionais</h4>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer">
                    <Checkbox checked={editingTemplate.hasInventory} onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, hasInventory: !!v })} />
                    <span className="text-sm">Inventário</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer">
                    <Checkbox checked={editingTemplate.hasAbilities} onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, hasAbilities: !!v })} />
                    <span className="text-sm">Habilidades, Magias e Talentos</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer">
                    <Checkbox checked={editingTemplate.hasNotes} onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, hasNotes: !!v })} />
                    <span className="text-sm">Anotações</span>
                  </label>
                </div>
              </TabsContent>

              <Button onClick={saveTemplate} className="w-full mt-4 gap-2"><Save className="w-4 h-4" />Salvar Modelo</Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT PLAYER DIALOG */}
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
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs text-muted-foreground">Nível</label><NumberInput min={1} value={editing.level} onChange={v => setEditing({ ...editing, level: v })} /></div>
                  <div><label className="text-xs text-muted-foreground">Experiência</label><NumberInput min={0} value={editing.experience} onChange={v => setEditing({ ...editing, experience: v })} /></div>
                  <div><label className="text-xs text-muted-foreground">Bônus de Proficiência</label><NumberInput value={editing.proficiencyBonus ?? 2} onChange={v => setEditing({ ...editing, proficiencyBonus: v })} /></div>
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

              <TabsContent value="skills" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">Clique no nome para marcar proficiência. O bônus é calculado automaticamente: <span className="text-primary">modificador do atributo + bônus de proficiência ({modStr(editing.proficiencyBonus ?? 2)})</span>.</p>
                <div className="space-y-2">
                  {editing.skills.map((s, i) => (
                    <SkillEditor key={`${s.name}-${i}`} s={s} i={i} />
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Input placeholder="Nome da perícia" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} className="flex-1" />
                  <Input placeholder="Atributo" value={newSkillAttr} onChange={e => setNewSkillAttr(e.target.value)} className="w-28" />
                  <Button variant="outline" size="sm" onClick={addSkill}><Plus className="w-3 h-3" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="combat" className="space-y-3 mt-3">
                {cf.hp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted-foreground">HP Atual</label><NumberInput value={editing.hp} onChange={v => setEditing({ ...editing, hp: v })} /></div>
                    <div><label className="text-xs text-muted-foreground">HP Máximo</label><NumberInput value={editing.maxHp} onChange={v => setEditing({ ...editing, maxHp: v })} /></div>
                  </div>
                )}
                {cf.mana && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted-foreground">Mana Atual</label><NumberInput value={editing.mana} onChange={v => setEditing({ ...editing, mana: v })} /></div>
                    <div><label className="text-xs text-muted-foreground">Mana Máxima</label><NumberInput value={editing.maxMana} onChange={v => setEditing({ ...editing, maxMana: v })} /></div>
                  </div>
                )}
                {cf.energy && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted-foreground">Energia Atual</label><NumberInput value={editing.energy} onChange={v => setEditing({ ...editing, energy: v })} /></div>
                    <div><label className="text-xs text-muted-foreground">Energia Máxima</label><NumberInput value={editing.maxEnergy} onChange={v => setEditing({ ...editing, maxEnergy: v })} /></div>
                  </div>
                )}
                {(cf.ca || cf.movement) && (
                  <div className="grid grid-cols-2 gap-3">
                    {cf.ca && <div><label className="text-xs text-muted-foreground">CA (Classe de Armadura)</label><NumberInput value={editing.ca} onChange={v => setEditing({ ...editing, ca: v })} /></div>}
                    {cf.movement && <div><label className="text-xs text-muted-foreground">Deslocamento (m)</label><NumberInput value={editing.movement} onChange={v => setEditing({ ...editing, movement: v })} /></div>}
                  </div>
                )}
                {!cf.hp && !cf.mana && !cf.energy && !cf.ca && !cf.movement && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum campo de combate configurado neste modelo.</p>
                )}
              </TabsContent>

              <TabsContent value="other" className="space-y-3 mt-3">
                {(editing.hasInventory ?? true) && (
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Backpack className="w-3 h-3" />Inventário</label>
                    <Textarea placeholder="Espada longa, escudo de madeira, poção de cura x3..." rows={4} value={editing.inventory} onChange={e => setEditing({ ...editing, inventory: e.target.value })} />
                  </div>
                )}
                {(editing.hasAbilities ?? true) && (
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" />Habilidades, Magias e Talentos</label>
                    <Textarea placeholder="Ataque Extra, Ação Ardilosa, Bola de Fogo..." rows={4} value={editing.abilities} onChange={e => setEditing({ ...editing, abilities: e.target.value })} />
                  </div>
                )}
                {(editing.hasNotes ?? true) && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Anotações</label>
                    <Textarea placeholder="Notas gerais sobre o personagem..." rows={4} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
                  </div>
                )}
                {!(editing.hasInventory ?? true) && !(editing.hasAbilities ?? true) && !(editing.hasNotes ?? true) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma seção adicional configurada neste modelo.</p>
                )}
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
