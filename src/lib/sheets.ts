import { supabase } from '@/integrations/supabase/client';

export interface SheetAttribute {
  id: string;
  label: string;   // AGILIDADE
  short: string;   // AGI
  value: number;
}

export interface SheetSkill {
  id: string;
  name: string;
  value: number;
  trained?: boolean;
}

export interface SheetResource {
  id: string;
  label: string;   // Vida
  short: string;   // PV
  current: number;
  max: number;
  tone: 'life' | 'sanity' | 'effort' | 'neutral';
}

export interface SheetAbility {
  id: string;
  name: string;
  cost: string;    // "3 PD"
  description: string;
}

export interface Sheet {
  id: string;
  kind: 'player' | 'monster';
  name: string;
  subtitle: string;
  origin: string;
  image_url: string;
  accent: string;
  attributes: SheetAttribute[];
  skills: SheetSkill[];
  resources: SheetResource[];
  abilities: SheetAbility[];
  notes: string;
  in_list: boolean;
  share_id: string;
  created_at: string;
  updated_at: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Atributos padrão de Ordem Paranormal */
export const DEFAULT_ATTRIBUTES = (): SheetAttribute[] => [
  { id: uid(), label: 'Agilidade', short: 'AGI', value: 1 },
  { id: uid(), label: 'Força', short: 'FOR', value: 1 },
  { id: uid(), label: 'Intelecto', short: 'INT', value: 1 },
  { id: uid(), label: 'Presença', short: 'PRE', value: 1 },
  { id: uid(), label: 'Vigor', short: 'VIG', value: 1 },
];

export const DEFAULT_RESOURCES = (): SheetResource[] => [
  { id: uid(), label: 'Vida', short: 'PV', current: 12, max: 12, tone: 'life' },
  { id: uid(), label: 'Sanidade', short: 'SAN', current: 12, max: 12, tone: 'sanity' },
  { id: uid(), label: 'Esforço', short: 'PE', current: 2, max: 2, tone: 'effort' },
];

/** Perícias de Ordem Paranormal */
export const OP_SKILLS = [
  'Acrobacia', 'Adestramento', 'Artes', 'Atletismo', 'Atualidades', 'Ciências',
  'Crime', 'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa',
  'Intimidação', 'Intuição', 'Investigação', 'Luta', 'Medicina', 'Ocultismo',
  'Percepção', 'Pilotagem', 'Pontaria', 'Profissão', 'Reflexos', 'Religião',
  'Sobrevivência', 'Tática', 'Tecnologia', 'Vontade',
];

export const DEFAULT_SKILLS = (): SheetSkill[] =>
  OP_SKILLS.map(name => ({ id: uid(), name, value: 0, trained: false }));

export const emptySheet = (kind: 'player' | 'monster'): Omit<Sheet, 'id' | 'share_id' | 'created_at' | 'updated_at'> => ({
  kind,
  name: kind === 'monster' ? 'Nova Criatura' : 'Novo Personagem',
  subtitle: '',
  origin: '',
  image_url: '',
  accent: 'red',
  attributes: DEFAULT_ATTRIBUTES(),
  skills: kind === 'monster' ? [] : DEFAULT_SKILLS(),
  resources: DEFAULT_RESOURCES(),
  abilities: [],
  notes: '',
  in_list: false,
});

const parse = (row: any): Sheet => ({
  ...row,
  attributes: (row.attributes ?? []) as SheetAttribute[],
  skills: (row.skills ?? []) as SheetSkill[],
  resources: (row.resources ?? []) as SheetResource[],
  abilities: (row.abilities ?? []) as SheetAbility[],
});

export async function listSheets(): Promise<Sheet[]> {
  const { data, error } = await supabase.from('sheets').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(parse);
}

export async function getSheetByShareId(shareId: string): Promise<Sheet | null> {
  const { data, error } = await supabase.from('sheets').select('*').eq('share_id', shareId).maybeSingle();
  if (error) throw error;
  return data ? parse(data) : null;
}

export async function createSheet(kind: 'player' | 'monster'): Promise<Sheet> {
  const { data, error } = await supabase.from('sheets').insert(emptySheet(kind) as any).select().single();
  if (error) throw error;
  return parse(data);
}

export async function updateSheet(id: string, patch: Partial<Sheet>): Promise<void> {
  const { error } = await supabase.from('sheets').update(patch as any).eq('id', id);
  if (error) throw error;
}

export async function deleteSheet(id: string): Promise<void> {
  const { error } = await supabase.from('sheets').delete().eq('id', id);
  if (error) throw error;
}

export const shareUrl = (shareId: string) =>
  `${window.location.origin}${window.location.pathname}#/ficha/${shareId}`;
