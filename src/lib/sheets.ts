import { systemTemplate } from './sheetSystems';
import { supabase } from '@/integrations/supabase/client';
import { listRows, createRow, updateRow, deleteRow } from '@/lib/userData';

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

export interface SheetRoll {
  expr: string;
  total: number;
  by: string;
  at: number;
  detail?: string;
}

export type SheetKind = 'player' | 'story' | 'monster';

export interface SheetStyle {
  color?: string;       // HSL triplo, ex "0 78% 55%"
  font?: 'display' | 'serif' | 'sans' | 'mono';
  layout?: 'right' | 'left' | 'full';
  overlay?: number;     // 0-100 escurecimento
  uppercase?: boolean;
  inventory?: InventoryItem[];
  system?: string;      // id em SHEET_SYSTEMS
  blockOrder?: string[]; // ordem visual dos blocos da ficha
}

export interface InventoryItem { id: string; name: string; qty: number; weight?: number; note?: string; }

export const STYLE_COLORS: { label: string; hsl: string }[] = [
  { label: 'Sangue', hsl: '0 78% 55%' }, { label: 'Ouro', hsl: '43 90% 55%' },
  { label: 'Brasa', hsl: '24 92% 55%' }, { label: 'Esmeralda', hsl: '150 65% 45%' },
  { label: 'Gelo', hsl: '190 90% 55%' }, { label: 'Arcano', hsl: '217 90% 60%' },
  { label: 'Sombra', hsl: '280 70% 62%' }, { label: 'Feitiço', hsl: '330 80% 62%' },
  { label: 'Osso', hsl: '40 25% 90%' },
];

export interface Sheet {
  id: string;
  kind: SheetKind;
  style: SheetStyle;
  name: string;
  subtitle: string;
  origin: string;
  age?: string;
  occupation?: string;
  profile?: string;
  background?: string;
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
  last_roll?: SheetRoll | null;
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

export const emptySheet = (kind: SheetKind, system = 'ordemparanormal'): Omit<Sheet, 'id' | 'share_id' | 'created_at' | 'updated_at'> => {
  const t = systemTemplate(system);
  return {
  kind,
  style: { system },
  name: kind === 'monster' ? 'Nova Criatura' : 'Novo Personagem',
  subtitle: '',
  origin: '',
  age: '',
  occupation: '',
  profile: '',
  background: '',
  image_url: '',
  accent: 'red',
  attributes: t.attributes,
  skills: kind === 'monster' ? [] : t.skills,
  resources: t.resources,
  abilities: [],
    notes: '',
    in_list: false,
    last_roll: null,
  };
};

const parse = (row: Record<string, unknown>): Sheet => {
  const source = row as Partial<Sheet>;
  return {
    ...source,
    attributes: (source.attributes ?? []) as SheetAttribute[],
    skills: (source.skills ?? []) as SheetSkill[],
    resources: (source.resources ?? []) as SheetResource[],
    abilities: (source.abilities ?? []) as SheetAbility[],
    style: (source.style ?? {}) as SheetStyle,
  } as Sheet;
};

export async function listSheets(): Promise<Sheet[]> {
  return (await listRows<Record<string, unknown>>('sheets')).map(parse);
}

export async function getSheetByShareId(shareId: string): Promise<Sheet | null> {
  const { data, error } = await supabase.functions.invoke('user-data', { body: { action: 'shared', shareId } });
  if (error) throw error;
  const response = data as { sheet?: Record<string, unknown> } | null;
  return response?.sheet ? parse(response.sheet) : null;
}

/** Jogador salva a própria ficha pelo link compartilhado. */
export async function updateSharedSheet(shareId: string, patch: Partial<Sheet>): Promise<void> {
  const { error } = await supabase.functions.invoke('user-data', { body: { action: 'shared-update', shareId, values: patch } });
  if (error) throw error;
}

export async function createSheet(kind: SheetKind, system?: string): Promise<Sheet> {
  return parse(await createRow<Record<string, unknown>>('sheets', emptySheet(kind, system)));
}

export async function updateSheet(id: string, patch: Partial<Sheet>): Promise<void> {
  await updateRow('sheets', id, { ...patch });
}

export async function deleteSheet(id: string): Promise<void> {
  await deleteRow('sheets', id);
}

export const shareUrl = (shareId: string) =>
  `${window.location.origin}${window.location.pathname}#/ficha/${shareId}`;
