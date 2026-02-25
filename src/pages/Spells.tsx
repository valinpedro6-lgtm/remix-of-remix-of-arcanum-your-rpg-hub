import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Trash2, Edit, X, Check, Sparkles, Zap, Clock,
  Target, Shield, BookOpen, Dices, ChevronDown, ChevronUp, Copy, Star, StarOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';

// --- TYPES ---

type SpellSchool = 'abjuracao' | 'adivinhacao' | 'conjuracao' | 'encantamento' | 'evocacao' | 'ilusao' | 'necromancia' | 'transmutacao';
type CastTime = 'acao' | 'acao_bonus' | 'reacao' | '1_minuto' | '10_minutos' | '1_hora' | '8_horas' | '12_horas' | '24_horas' | 'especial';
type SpellRange = 'pessoal' | 'toque' | '3m' | '9m' | '18m' | '27m' | '36m' | '45m' | '90m' | '150m' | '300m' | '1.5km' | 'ilimitado' | 'especial';

interface DamageRoll {
  dice: string; // e.g. "3d8"
  type: string; // e.g. "fogo"
  bonus?: string;
}

interface Spell {
  id: string;
  name: string;
  level: number; // 0 = truque
  school: SpellSchool;
  castTime: CastTime;
  range: SpellRange;
  duration: string;
  components: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  mechanicalEffect: string;
  damage?: DamageRoll;
  saveDC?: string;
  higherLevels?: string;
  favorite: boolean;
  custom: boolean;
}

// --- DATA ---

const SCHOOL_INFO: Record<SpellSchool, { label: string; emoji: string; color: string }> = {
  abjuracao: { label: 'Abjuração', emoji: '🛡️', color: 'text-blue-400' },
  adivinhacao: { label: 'Adivinhação', emoji: '🔮', color: 'text-violet-400' },
  conjuracao: { label: 'Conjuração', emoji: '✨', color: 'text-amber-400' },
  encantamento: { label: 'Encantamento', emoji: '💫', color: 'text-pink-400' },
  evocacao: { label: 'Evocação', emoji: '🔥', color: 'text-red-400' },
  ilusao: { label: 'Ilusão', emoji: '👁️', color: 'text-teal-400' },
  necromancia: { label: 'Necromancia', emoji: '💀', color: 'text-green-400' },
  transmutacao: { label: 'Transmutação', emoji: '⚗️', color: 'text-orange-400' },
};

const CAST_TIME_LABEL: Record<CastTime, string> = {
  acao: '1 Ação',
  acao_bonus: '1 Ação Bônus',
  reacao: '1 Reação',
  '1_minuto': '1 Minuto',
  '10_minutos': '10 Minutos',
  '1_hora': '1 Hora',
  '8_horas': '8 Horas',
  '12_horas': '12 Horas',
  '24_horas': '24 Horas',
  especial: 'Especial',
};

const DAMAGE_TYPES = ['ácido', 'contundente', 'cortante', 'elétrico', 'fogo', 'força', 'frio', 'necrótico', 'perfurante', 'psíquico', 'radiante', 'trovão', 'veneno'];

const DEFAULT_SPELLS: Spell[] = [
  // Truques (0)
  {
    id: 'fb-001', name: 'Rajada de Fogo', level: 0, school: 'evocacao', castTime: 'acao',
    range: '36m', duration: 'Instantânea', components: 'V, S', concentration: false, ritual: false,
    description: 'Você arremessa uma partícula de fogo em uma criatura ou objeto ao alcance.',
    mechanicalEffect: 'Ataque à distância com magia. Acerto: 1d10 dano de fogo. Dano aumenta nos níveis 5 (2d10), 11 (3d10) e 17 (4d10).',
    damage: { dice: '1d10', type: 'fogo' }, favorite: false, custom: false,
  },
  {
    id: 'fb-002', name: 'Raio de Gelo', level: 0, school: 'evocacao', castTime: 'acao',
    range: '18m', duration: 'Instantânea', components: 'V, S', concentration: false, ritual: false,
    description: 'Um raio de energia azulada e gélida sai em direção a uma criatura ao alcance.',
    mechanicalEffect: 'Ataque à distância com magia. Acerto: 1d8 dano de frio e velocidade reduzida em 3m até seu próximo turno.',
    damage: { dice: '1d8', type: 'frio' }, favorite: false, custom: false,
  },
  {
    id: 'fb-003', name: 'Toque Arrepiante', level: 0, school: 'necromancia', castTime: 'acao',
    range: '36m', duration: '1 rodada', components: 'V, S', concentration: false, ritual: false,
    description: 'Uma mão fantasmagórica e esquelética agarra o alvo, drenando sua vitalidade.',
    mechanicalEffect: 'Ataque à distância com magia. Acerto: 1d8 dano necrótico e não pode recuperar PV até seu próximo turno. Contra mortos-vivos: desvantagem em ataques contra você.',
    damage: { dice: '1d8', type: 'necrótico' }, favorite: false, custom: false,
  },
  {
    id: 'fb-004', name: 'Luz', level: 0, school: 'evocacao', castTime: 'acao',
    range: 'toque', duration: '1 hora', components: 'V, M', concentration: false, ritual: false,
    description: 'Você toca um objeto. O objeto emite luz plena num raio de 6m e luz fraca por mais 6m.',
    mechanicalEffect: 'Iluminação: 6m luz plena + 6m luz fraca. Criatura hostil: teste DEX para evitar.', favorite: false, custom: false,
  },
  {
    id: 'fb-005', name: 'Prestidigitação', level: 0, school: 'transmutacao', castTime: 'acao',
    range: '9m', duration: 'Até 1 hora', components: 'V, S', concentration: false, ritual: false,
    description: 'Truque mágico versátil para efeitos sensoriais menores.',
    mechanicalEffect: 'Efeitos menores: limpar/sujar, esquentar/esfriar, sabor, marca, som, trinket ilusório. Até 3 efeitos simultâneos.', favorite: false, custom: false,
  },
  // Nível 1
  {
    id: 'fb-010', name: 'Mísseis Mágicos', level: 1, school: 'evocacao', castTime: 'acao',
    range: '36m', duration: 'Instantânea', components: 'V, S', concentration: false, ritual: false,
    description: 'Três dardos brilhantes de força mágica atingem seus alvos automaticamente.',
    mechanicalEffect: '3 dardos, cada um causa 1d4+1 de dano de força. Acerto automático (exceto Escudo).',
    damage: { dice: '3d4', type: 'força', bonus: '+3' },
    higherLevels: '+1 dardo por nível acima do 1º.', favorite: false, custom: false,
  },
  {
    id: 'fb-011', name: 'Escudo', level: 1, school: 'abjuracao', castTime: 'reacao',
    range: 'pessoal', duration: '1 rodada', components: 'V, S', concentration: false, ritual: false,
    description: 'Uma barreira de força invisível aparece e o protege.',
    mechanicalEffect: '+5 CA até o início do seu próximo turno, inclusive contra o ataque que ativou. Imune a Mísseis Mágicos.', favorite: false, custom: false,
  },
  {
    id: 'fb-012', name: 'Mãos Flamejantes', level: 1, school: 'evocacao', castTime: 'acao',
    range: 'pessoal', duration: 'Instantânea', components: 'V, S', concentration: false, ritual: false,
    description: 'Cone de chamas de 4,5m parte das suas mãos.',
    mechanicalEffect: 'Cone 4,5m. Cada criatura na área: teste DEX CD magia. Falha: 3d6 fogo. Sucesso: metade.',
    damage: { dice: '3d6', type: 'fogo' }, saveDC: 'DEX',
    higherLevels: '+1d6 por nível acima do 1º.', favorite: false, custom: false,
  },
  {
    id: 'fb-013', name: 'Curar Ferimentos', level: 1, school: 'evocacao', castTime: 'acao',
    range: 'toque', duration: 'Instantânea', components: 'V, S', concentration: false, ritual: false,
    description: 'Uma criatura que você toca recupera pontos de vida.',
    mechanicalEffect: 'Cura 1d8 + mod. de conjuração PV. Sem efeito em mortos-vivos e constructos.',
    damage: { dice: '1d8', type: 'cura' },
    higherLevels: '+1d8 por nível acima do 1º.', favorite: false, custom: false,
  },
  {
    id: 'fb-014', name: 'Detectar Magia', level: 1, school: 'adivinhacao', castTime: 'acao',
    range: 'pessoal', duration: '10 minutos', components: 'V, S', concentration: true, ritual: true,
    description: 'Você sente a presença de magia em um raio de 9m.',
    mechanicalEffect: 'Detecta magia em 9m. Ação para ver a aura e escola. Bloqueado por 30cm pedra, 2,5cm metal, folha de chumbo, 90cm madeira ou terra.', favorite: false, custom: false,
  },
  // Nível 2
  {
    id: 'fb-020', name: 'Invisibilidade', level: 2, school: 'ilusao', castTime: 'acao',
    range: 'toque', duration: '1 hora', components: 'V, S, M', concentration: true, ritual: false,
    description: 'Uma criatura que você toca se torna invisível.',
    mechanicalEffect: 'Alvo invisível. Tudo que carrega também fica invisível. Termina se atacar ou conjurar.',
    higherLevels: '+1 alvo por nível acima do 2º.', favorite: false, custom: false,
  },
  {
    id: 'fb-021', name: 'Imobilizar Pessoa', level: 2, school: 'encantamento', castTime: 'acao',
    range: '18m', duration: '1 minuto', components: 'V, S, M', concentration: true, ritual: false,
    description: 'Você paralisa um humanoide ao alcance.',
    mechanicalEffect: 'Alvo: teste SAB ou paralisado. Repete o teste no final de cada turno. Ataques corpo-a-corpo contra o alvo: crítico automático.',
    saveDC: 'SAB', higherLevels: '+1 alvo por nível acima do 2º.', favorite: false, custom: false,
  },
  // Nível 3
  {
    id: 'fb-030', name: 'Bola de Fogo', level: 3, school: 'evocacao', castTime: 'acao',
    range: '45m', duration: 'Instantânea', components: 'V, S, M', concentration: false, ritual: false,
    description: 'Uma explosão flamejante irrompe num ponto ao alcance, engolfando tudo em um raio de 6m.',
    mechanicalEffect: 'Esfera 6m raio. Cada criatura: teste DEX CD magia. Falha: 8d6 fogo. Sucesso: metade. Incendeia objetos inflamáveis.',
    damage: { dice: '8d6', type: 'fogo' }, saveDC: 'DEX',
    higherLevels: '+1d6 por nível acima do 3º.', favorite: false, custom: false,
  },
  {
    id: 'fb-031', name: 'Relâmpago', level: 3, school: 'evocacao', castTime: 'acao',
    range: 'pessoal', duration: 'Instantânea', components: 'V, S, M', concentration: false, ritual: false,
    description: 'Um raio de eletricidade forma uma linha de 30m de comprimento e 1,5m de largura.',
    mechanicalEffect: 'Linha 30m x 1,5m. Cada criatura: teste DEX CD magia. Falha: 8d6 elétrico. Sucesso: metade.',
    damage: { dice: '8d6', type: 'elétrico' }, saveDC: 'DEX',
    higherLevels: '+1d6 por nível acima do 3º.', favorite: false, custom: false,
  },
  {
    id: 'fb-032', name: 'Dissipar Magia', level: 3, school: 'abjuracao', castTime: 'acao',
    range: '36m', duration: 'Instantânea', components: 'V, S', concentration: false, ritual: false,
    description: 'Você cancela um efeito mágico no alvo.',
    mechanicalEffect: 'Magias nível 3 ou menor: dissipadas automaticamente. Nível 4+: teste de habilidade de conjuração CD 10 + nível da magia.', favorite: false, custom: false,
  },
  // Nível 4
  {
    id: 'fb-040', name: 'Porta Dimensional', level: 4, school: 'conjuracao', castTime: 'acao',
    range: '150m', duration: 'Instantânea', components: 'V', concentration: false, ritual: false,
    description: 'Você se teleporta para um ponto que pode ver, visualizar ou descrever.',
    mechanicalEffect: 'Teleporte até 150m. Pode levar 1 criatura voluntária de tamanho Médio ou menor.', favorite: false, custom: false,
  },
  // Nível 5
  {
    id: 'fb-050', name: 'Cone de Frio', level: 5, school: 'evocacao', castTime: 'acao',
    range: 'pessoal', duration: 'Instantânea', components: 'V, S, M', concentration: false, ritual: false,
    description: 'Uma rajada de ar frio emana das suas mãos em um cone de 18m.',
    mechanicalEffect: 'Cone 18m. Cada criatura: teste CON CD magia. Falha: 8d8 frio. Sucesso: metade. Criaturas mortas viram estátuas de gelo.',
    damage: { dice: '8d8', type: 'frio' }, saveDC: 'CON',
    higherLevels: '+1d8 por nível acima do 5º.', favorite: false, custom: false,
  },
  // Nível 6
  {
    id: 'fb-060', name: 'Desintegrar', level: 6, school: 'transmutacao', castTime: 'acao',
    range: '18m', duration: 'Instantânea', components: 'V, S, M', concentration: false, ritual: false,
    description: 'Um fino raio verde parte do seu dedo em direção ao alvo.',
    mechanicalEffect: 'Alvo: teste DEX CD magia. Falha: 10d6+40 de dano de força. Se cair a 0 PV: desintegrado. Sucesso: nenhum dano.',
    damage: { dice: '10d6', type: 'força', bonus: '+40' }, saveDC: 'DEX',
    higherLevels: '+3d6 por nível acima do 6º.', favorite: false, custom: false,
  },
  // Nível 7
  {
    id: 'fb-070', name: 'Teletransporte', level: 7, school: 'conjuracao', castTime: 'acao',
    range: '3m', duration: 'Instantânea', components: 'V', concentration: false, ritual: false,
    description: 'Você e até 8 criaturas são transportados para um destino que você conhece.',
    mechanicalEffect: 'Teleporte no mesmo plano. Precisão depende da familiaridade: Círculo (100%), Muito familiar (d100: 1-2 acidente), Visto casualmente (1-33 área similar, 34-43 fora do alvo).', favorite: false, custom: false,
  },
  // Nível 8
  {
    id: 'fb-080', name: 'Explosão Solar', level: 8, school: 'evocacao', castTime: 'acao',
    range: '45m', duration: 'Instantânea', components: 'V, S, M', concentration: false, ritual: false,
    description: 'Luz solar brilhante irradia em uma esfera de 18m de raio centrada em um ponto.',
    mechanicalEffect: 'Esfera 18m. Cada criatura: teste CON CD magia. Falha: 12d6 radiante + cegueira permanente. Sucesso: metade, sem cegueira.',
    damage: { dice: '12d6', type: 'radiante' }, saveDC: 'CON', favorite: false, custom: false,
  },
  // Nível 9
  {
    id: 'fb-090', name: 'Desejo', level: 9, school: 'conjuracao', castTime: 'acao',
    range: 'pessoal', duration: 'Instantânea', components: 'V', concentration: false, ritual: false,
    description: 'A mais poderosa magia que um mortal pode conjurar. Você altera a realidade.',
    mechanicalEffect: 'Duplicar qualquer magia nível 8 ou menor sem componentes. Outros efeitos: a critério do Mestre, com risco de nunca mais poder conjurar Desejo.', favorite: false, custom: false,
  },
];

// --- HELPERS ---

function rollDice(notation: string): { total: number; rolls: number[]; notation: string } {
  const match = notation.match(/^(\d+)d(\d+)$/);
  if (!match) return { total: 0, rolls: [], notation };
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  return { total: rolls.reduce((a, b) => a + b, 0), rolls, notation };
}

function parseBonusNumber(bonus?: string): number {
  if (!bonus) return 0;
  return parseInt(bonus.replace('+', '')) || 0;
}

const EMPTY_SPELL: Omit<Spell, 'id'> = {
  name: '', level: 0, school: 'evocacao', castTime: 'acao',
  range: '18m', duration: 'Instantânea', components: 'V, S',
  concentration: false, ritual: false,
  description: '', mechanicalEffect: '', favorite: false, custom: true,
};

// --- COMPONENT ---

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03, type: 'spring' as const, stiffness: 200, damping: 20 } }),
};

const Spells = () => {
  const [spells, setSpells] = useLocalStorage<Spell[]>('arcanum-spells', DEFAULT_SPELLS);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('todos');
  const [filterSchool, setFilterSchool] = useState<string>('todos');
  const [filterCast, setFilterCast] = useState<string>('todos');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEffect, setEditingEffect] = useState<Record<string, string>>({});
  const [rollResults, setRollResults] = useState<Record<string, { total: number; rolls: number[]; bonus: number }>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Spell, 'id'>>(EMPTY_SPELL);
  const [editFullId, setEditFullId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return spells.filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel !== 'todos' && s.level !== parseInt(filterLevel)) return false;
      if (filterSchool !== 'todos' && s.school !== filterSchool) return false;
      if (filterCast !== 'todos' && s.castTime !== filterCast) return false;
      if (showFavOnly && !s.favorite) return false;
      return true;
    }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [spells, search, filterLevel, filterSchool, filterCast, showFavOnly]);

  const toggleFav = useCallback((id: string) => {
    setSpells(prev => prev.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s));
  }, [setSpells]);

  const handleRoll = useCallback((spell: Spell) => {
    if (!spell.damage) return;
    const result = rollDice(spell.damage.dice);
    const bonus = parseBonusNumber(spell.damage.bonus);
    setRollResults(prev => ({ ...prev, [spell.id]: { total: result.total + bonus, rolls: result.rolls, bonus } }));
  }, []);

  const saveEffect = useCallback((id: string) => {
    setSpells(prev => prev.map(s => s.id === id ? { ...s, mechanicalEffect: editingEffect[id] ?? s.mechanicalEffect } : s));
    setEditingId(null);
  }, [setSpells, editingEffect]);

  const deleteSpell = useCallback((id: string) => {
    setSpells(prev => prev.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [setSpells, expandedId]);

  const duplicateSpell = useCallback((spell: Spell) => {
    const newSpell: Spell = { ...spell, id: crypto.randomUUID(), name: spell.name + ' (cópia)', custom: true };
    setSpells(prev => [...prev, newSpell]);
  }, [setSpells]);

  const openCreateDialog = () => {
    setFormData(EMPTY_SPELL);
    setEditFullId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (spell: Spell) => {
    const { id, ...rest } = spell;
    setFormData(rest);
    setEditFullId(id);
    setDialogOpen(true);
  };

  const saveForm = () => {
    if (!formData.name.trim()) return;
    if (editFullId) {
      setSpells(prev => prev.map(s => s.id === editFullId ? { ...formData, id: editFullId } : s));
    } else {
      const newSpell: Spell = { ...formData, id: crypto.randomUUID(), custom: true };
      setSpells(prev => [...prev, newSpell]);
    }
    setDialogOpen(false);
  };

  const updateForm = (patch: Partial<Omit<Spell, 'id'>>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const levelLabel = (l: number) => l === 0 ? 'Truque' : `Nível ${l}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Grimório de Magias</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> Nova Magia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editFullId ? 'Editar Magia' : 'Nova Magia'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Nome da magia" value={formData.name} onChange={e => updateForm({ name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Nível</label>
                  <Select value={String(formData.level)} onValueChange={v => updateForm({ level: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0,1,2,3,4,5,6,7,8,9].map(l => (
                        <SelectItem key={l} value={String(l)}>{levelLabel(l)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Escola</label>
                  <Select value={formData.school} onValueChange={(v: SpellSchool) => updateForm({ school: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SCHOOL_INFO) as SpellSchool[]).map(s => (
                        <SelectItem key={s} value={s}>{SCHOOL_INFO[s].emoji} {SCHOOL_INFO[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Tempo de Conjuração</label>
                  <Select value={formData.castTime} onValueChange={(v: CastTime) => updateForm({ castTime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CAST_TIME_LABEL) as CastTime[]).map(c => (
                        <SelectItem key={c} value={c}>{CAST_TIME_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Alcance</label>
                  <Select value={formData.range} onValueChange={(v: SpellRange) => updateForm({ range: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['pessoal','toque','3m','9m','18m','27m','36m','45m','90m','150m','300m','1.5km','ilimitado','especial'] as SpellRange[]).map(r => (
                        <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Duração (ex: 1 hora)" value={formData.duration} onChange={e => updateForm({ duration: e.target.value })} />
                <Input placeholder="Componentes (V, S, M)" value={formData.components} onChange={e => updateForm({ components: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.concentration} onChange={e => updateForm({ concentration: e.target.checked })} className="rounded" /> Concentração
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.ritual} onChange={e => updateForm({ ritual: e.target.checked })} className="rounded" /> Ritual
                </label>
              </div>
              <Textarea placeholder="Descrição..." value={formData.description} onChange={e => updateForm({ description: e.target.value })} rows={3} />
              <Textarea placeholder="Efeito mecânico..." value={formData.mechanicalEffect} onChange={e => updateForm({ mechanicalEffect: e.target.value })} rows={2} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Dados (ex: 3d6)" value={formData.damage?.dice || ''} onChange={e => updateForm({ damage: { dice: e.target.value, type: formData.damage?.type || 'fogo', bonus: formData.damage?.bonus } })} />
                <Select value={formData.damage?.type || 'fogo'} onValueChange={v => updateForm({ damage: { dice: formData.damage?.dice || '', type: v, bonus: formData.damage?.bonus } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Bônus (+3)" value={formData.damage?.bonus || ''} onChange={e => updateForm({ damage: { dice: formData.damage?.dice || '', type: formData.damage?.type || 'fogo', bonus: e.target.value } })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Save (ex: DEX)" value={formData.saveDC || ''} onChange={e => updateForm({ saveDC: e.target.value })} />
                <Input placeholder="Em níveis superiores..." value={formData.higherLevels || ''} onChange={e => updateForm({ higherLevels: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={saveForm} disabled={!formData.name.trim()}>
                  <Check className="w-4 h-4 mr-1" /> {editFullId ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar magia..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-28 h-9"><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {[0,1,2,3,4,5,6,7,8,9].map(l => (
                  <SelectItem key={l} value={String(l)}>{levelLabel(l)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Escola" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {(Object.keys(SCHOOL_INFO) as SpellSchool[]).map(s => (
                  <SelectItem key={s} value={s}>{SCHOOL_INFO[s].emoji} {SCHOOL_INFO[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCast} onValueChange={setFilterCast}>
              <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Tempo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(Object.keys(CAST_TIME_LABEL) as CastTime[]).map(c => (
                  <SelectItem key={c} value={c}>{CAST_TIME_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={showFavOnly ? 'default' : 'outline'} size="sm" onClick={() => setShowFavOnly(v => !v)}>
              <Star className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{filtered.length} magia{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Spell List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((spell, i) => {
            const school = SCHOOL_INFO[spell.school];
            const isExpanded = expandedId === spell.id;
            const isEditingEffect = editingId === spell.id;
            const roll = rollResults[spell.id];

            return (
              <motion.div
                key={spell.id}
                custom={i}
                variants={cardAnim}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="card-hover overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : spell.id)}
                  >
                    <span className="text-xl flex-shrink-0">{school.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm truncate">{spell.name}</span>
                        <Badge variant="secondary" className="text-[10px] py-0">{levelLabel(spell.level)}</Badge>
                        <Badge variant="outline" className={`text-[10px] py-0 ${school.color}`}>{school.label}</Badge>
                        {spell.concentration && <Badge variant="outline" className="text-[10px] py-0">C</Badge>}
                        {spell.ritual && <Badge variant="outline" className="text-[10px] py-0">R</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        <span><Clock className="w-3 h-3 inline mr-0.5" />{CAST_TIME_LABEL[spell.castTime]}</span>
                        <span><Target className="w-3 h-3 inline mr-0.5" />{spell.range}</span>
                        {spell.damage && <span><Zap className="w-3 h-3 inline mr-0.5" />{spell.damage.dice} {spell.damage.type}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); toggleFav(spell.id); }}>
                        {spell.favorite ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <StarOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      {spell.damage && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); handleRoll(spell); }}>
                          <Dices className="w-3 h-3" /> Rolar
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Roll result */}
                  <AnimatePresence>
                    {roll && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-2">
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-muted-foreground">Resultado:</span>
                            <div className="flex gap-1">
                              {roll.rolls.map((r, idx) => (
                                <motion.span
                                  key={idx}
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: idx * 0.05, type: 'spring' as const }}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded bg-secondary border border-border text-xs font-bold"
                                >
                                  {r}
                                </motion.span>
                              ))}
                            </div>
                            {roll.bonus > 0 && <span className="text-xs text-primary font-bold">+{roll.bonus}</span>}
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3, type: 'spring' as const }}
                              className="text-2xl font-display font-bold text-primary"
                            >
                              = {roll.total}
                            </motion.span>
                            <Badge variant="secondary" className="text-xs">{spell.damage?.type}</Badge>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-secondary/50 rounded p-2">
                              <span className="text-muted-foreground">Duração</span>
                              <p className="font-semibold">{spell.duration}</p>
                            </div>
                            <div className="bg-secondary/50 rounded p-2">
                              <span className="text-muted-foreground">Componentes</span>
                              <p className="font-semibold">{spell.components}</p>
                            </div>
                            {spell.saveDC && (
                              <div className="bg-secondary/50 rounded p-2">
                                <span className="text-muted-foreground">Salvaguarda</span>
                                <p className="font-semibold">{spell.saveDC}</p>
                              </div>
                            )}
                            {spell.damage && (
                              <div className="bg-secondary/50 rounded p-2">
                                <span className="text-muted-foreground">Dano</span>
                                <p className="font-semibold">{spell.damage.dice}{spell.damage.bonus ? ` ${spell.damage.bonus}` : ''} {spell.damage.type}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground font-semibold mb-1"><BookOpen className="w-3 h-3 inline mr-1" />Descrição</p>
                            <p className="text-sm">{spell.description}</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-muted-foreground font-semibold"><Zap className="w-3 h-3 inline mr-1" />Efeito Mecânico</p>
                              {!isEditingEffect && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setEditingId(spell.id); setEditingEffect(prev => ({ ...prev, [spell.id]: spell.mechanicalEffect })); }}>
                                  <Edit className="w-3 h-3 mr-1" /> Editar
                                </Button>
                              )}
                            </div>
                            {isEditingEffect ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingEffect[spell.id] ?? spell.mechanicalEffect}
                                  onChange={e => setEditingEffect(prev => ({ ...prev, [spell.id]: e.target.value }))}
                                  rows={3}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 text-xs" onClick={() => saveEffect(spell.id)}>
                                    <Check className="w-3 h-3 mr-1" /> Salvar
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                                    <X className="w-3 h-3 mr-1" /> Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm bg-secondary/30 rounded p-2 border border-border/50">{spell.mechanicalEffect}</p>
                            )}
                          </div>

                          {spell.higherLevels && (
                            <div>
                              <p className="text-xs text-muted-foreground font-semibold mb-1"><Sparkles className="w-3 h-3 inline mr-1" />Em Níveis Superiores</p>
                              <p className="text-sm">{spell.higherLevels}</p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEditDialog(spell)}>
                              <Edit className="w-3 h-3 mr-1" /> Editar Tudo
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => duplicateSpell(spell)}>
                              <Copy className="w-3 h-3 mr-1" /> Duplicar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteSpell(spell.id)}>
                              <Trash2 className="w-3 h-3 mr-1" /> Excluir
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma magia encontrada</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> Criar Magia
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Spells;
