import type { Sheet, SheetAbility, SheetAttribute, SheetSkill } from '@/lib/sheets';
import type { Roll } from '@/components/DiceBar';

export interface DerivedStat {
  id: string;
  label: string;
  value: number;
  rollable?: boolean;
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const attributeValue = (attributes: SheetAttribute[], names: string[]) => {
  const wanted = names.map(normalize);
  const found = attributes.find(attribute => {
    const label = normalize(attribute.label);
    const short = normalize(attribute.short);
    return wanted.some(name => label.includes(name) || short === name);
  });
  return found?.value ?? 0;
};

const skillValue = (skills: SheetSkill[], names: string[]) => {
  const wanted = names.map(normalize);
  const found = skills.find(skill => wanted.some(name => normalize(skill.name).includes(name)));
  if (!found) return 0;
  return found.trained ? Math.max(5, found.value) : found.value;
};

const resourceValue = (sheet: Sheet, shorts: string[]) => {
  const wanted = shorts.map(normalize);
  const found = sheet.resources.find(resource => wanted.includes(normalize(resource.short)) || wanted.includes(normalize(resource.label)));
  return found?.max ?? 0;
};

const genericStats = (sheet: Sheet): DerivedStat[] => [
  { id: 'initiative', label: 'Iniciativa', value: attributeValue(sheet.attributes, ['agilidade', 'destreza', 'reflexos', 'reacao', 'reação']) + skillValue(sheet.skills, ['iniciativa']), rollable: true },
  { id: 'perception', label: 'Percepção', value: attributeValue(sheet.attributes, ['presenca', 'presença', 'sabedoria', 'intuicao', 'intuição', 'poder']) + skillValue(sheet.skills, ['percepcao', 'percepção', 'notar', 'escutar']), rollable: true },
];

export const derivedStats = (sheet: Sheet): DerivedStat[] => {
  const system = sheet.style?.system ?? 'custom';
  if (system === 'ordemparanormal') {
    return [
      { id: 'defense', label: 'Defesa', value: 10 + attributeValue(sheet.attributes, ['agilidade', 'agi']) },
      { id: 'initiative', label: 'Iniciativa', value: attributeValue(sheet.attributes, ['agilidade', 'agi']) + skillValue(sheet.skills, ['iniciativa']), rollable: true },
      { id: 'perception', label: 'Percepção', value: attributeValue(sheet.attributes, ['presenca', 'presença', 'pre']) + skillValue(sheet.skills, ['percepcao', 'percepção']), rollable: true },
      { id: 'load', label: 'Carga', value: 5 + attributeValue(sheet.attributes, ['forca', 'força', 'for']) },
    ];
  }
  if (system === 'dnd5e') {
    return [
      { id: 'armor', label: 'Classe de Armadura', value: resourceValue(sheet, ['ca', 'classe de armadura']) || 10 + attributeValue(sheet.attributes, ['destreza', 'des']) },
      { id: 'initiative', label: 'Iniciativa', value: attributeValue(sheet.attributes, ['destreza', 'des']) + skillValue(sheet.skills, ['iniciativa']), rollable: true },
      { id: 'perception', label: 'Percepção', value: attributeValue(sheet.attributes, ['sabedoria', 'sab']) + skillValue(sheet.skills, ['percepcao', 'percepção']), rollable: true },
      { id: 'load', label: 'Carga', value: attributeValue(sheet.attributes, ['forca', 'força', 'for']) * 15 },
    ];
  }
  if (system === 'tormenta20') {
    return [
      { id: 'defense', label: 'Defesa', value: resourceValue(sheet, ['def', 'defesa']) || 10 + attributeValue(sheet.attributes, ['destreza', 'des']) },
      { id: 'initiative', label: 'Iniciativa', value: attributeValue(sheet.attributes, ['destreza', 'des']) + skillValue(sheet.skills, ['iniciativa']), rollable: true },
      { id: 'perception', label: 'Percepção', value: attributeValue(sheet.attributes, ['sabedoria', 'sab']) + skillValue(sheet.skills, ['percepcao', 'percepção']), rollable: true },
      { id: 'load', label: 'Carga', value: attributeValue(sheet.attributes, ['forca', 'força', 'for']) },
    ];
  }
  if (system === 'pf2e') {
    return [
      { id: 'armor', label: 'Classe de Armadura', value: resourceValue(sheet, ['ca', 'classe de armadura']) || 10 + attributeValue(sheet.attributes, ['destreza', 'des']) },
      { id: 'perception', label: 'Percepção', value: attributeValue(sheet.attributes, ['sabedoria', 'sab']) + skillValue(sheet.skills, ['percepcao', 'percepção']), rollable: true },
      { id: 'initiative', label: 'Iniciativa', value: skillValue(sheet.skills, ['iniciativa']) + attributeValue(sheet.attributes, ['destreza', 'des']), rollable: true },
      { id: 'load', label: 'Carga', value: attributeValue(sheet.attributes, ['forca', 'força', 'for']) },
    ];
  }
  if (system === 'cthulhu') {
    return [
      { id: 'dodge', label: 'Esquiva', value: skillValue(sheet.skills, ['esquiva']) || Math.floor(attributeValue(sheet.attributes, ['destreza', 'des']) / 2) },
      { id: 'initiative', label: 'Iniciativa', value: attributeValue(sheet.attributes, ['destreza', 'des']), rollable: true },
      { id: 'luck', label: 'Sorte', value: resourceValue(sheet, ['sor', 'sorte']), rollable: true },
    ];
  }
  if (system === 'cpred') {
    return [
      { id: 'evasion', label: 'Evasão', value: skillValue(sheet.skills, ['esquiva']) || 10 + attributeValue(sheet.attributes, ['reflexos', 'ref']) },
      { id: 'initiative', label: 'Iniciativa', value: attributeValue(sheet.attributes, ['reflexos', 'ref']) + skillValue(sheet.skills, ['iniciativa']), rollable: true },
      { id: 'humanity', label: 'Humanidade', value: resourceValue(sheet, ['hum', 'humanidade']) },
    ];
  }
  return genericStats(sheet);
};

const d20 = () => 1 + Math.floor(Math.random() * 20);
const signed = (value: number) => value >= 0 ? `+${value}` : String(value);
const result = (expr: string, total: number, by: string, detail: string): Roll => ({ expr, total, by, at: Date.now(), detail });

export const rollAttribute = (sheet: Sheet, attribute: SheetAttribute): Roll => {
  const die = d20();
  return result(`d20 ${signed(attribute.value)}`, die + attribute.value, sheet.name, `${attribute.label}: ${die} ${signed(attribute.value)}`);
};

export const rollSkill = (sheet: Sheet, skill: SheetSkill): Roll => {
  const die = d20();
  const modifier = skill.trained ? Math.max(5, skill.value) : skill.value;
  return result(`d20 ${signed(modifier)}`, die + modifier, sheet.name, `${skill.name}: ${die} ${signed(modifier)}`);
};

export const rollDerived = (sheet: Sheet, id: string): Roll => {
  const stat = derivedStats(sheet).find(entry => entry.id === id) ?? genericStats(sheet)[0];
  const die = d20();
  return result(`d20 ${signed(stat.value)}`, die + stat.value, sheet.name, `${stat.label}: ${die} ${signed(stat.value)}`);
};

const formulaValue = (sheet: Sheet, name: string) => {
  const key = normalize(name.trim());
  const attr = sheet.attributes.find(a => normalize(a.label) === key || normalize(a.short) === key);
  if (attr) return attr.value;
  const skill = sheet.skills.find(s => normalize(s.name) === key);
  if (skill) return skill.trained ? Math.max(5, skill.value) : skill.value;
  const resource = sheet.resources.find(r => normalize(r.label) === key || normalize(r.short) === key);
  return resource?.current ?? 0;
};

/** Interpreta expressões simples como 2d6 + Força ou 1d20 + AGI. */
export const rollFormula = (sheet: Sheet, expression: string, label = 'Rolagem'): Roll => {
  const source = expression.trim() || '1d20';
  const detail: string[] = [];
  let total = 0;
  const tokens = source.replace(/\s+/g, '').match(/[+-]?[^+-]+/g) ?? ['1d20'];
  for (const token of tokens) {
    const sign = token.startsWith('-') ? -1 : 1;
    const raw = token.replace(/^[+-]/, '');
    const dice = raw.match(/^(\d*)d(\d+)$/i);
    if (dice) {
      const count = Math.min(20, Math.max(1, Number(dice[1] || 1)));
      const sides = Math.min(1000, Math.max(2, Number(dice[2])));
      const values = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
      const subtotal = values.reduce((sum, value) => sum + value, 0) * sign;
      total += subtotal;
      detail.push(`${sign < 0 ? '-' : ''}${values.join('+')}`);
    } else {
      const value = Number.isFinite(Number(raw)) ? Number(raw) : formulaValue(sheet, raw);
      total += value * sign;
      detail.push(`${sign < 0 ? '-' : ''}${value}`);
    }
  }
  return result(source, total, sheet.name, `${label}: ${detail.join(' ')} = ${total}`);
};

export const rollAbility = (sheet: Sheet, ability: SheetAbility): Roll =>
  rollFormula(sheet, ability.formula || '1d20', ability.name);
