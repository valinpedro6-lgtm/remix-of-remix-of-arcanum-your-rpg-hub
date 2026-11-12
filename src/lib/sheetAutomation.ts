import type { Sheet, SheetAttribute, SheetSkill } from '@/lib/sheets';
import type { Roll } from '@/components/DiceBar';

export interface DerivedStats {
  defense: number;
  initiative: number;
  perception: number;
  load: number;
}

const attributeValue = (attributes: SheetAttribute[], names: string[]) => {
  const found = attributes.find(attribute => names.some(name => attribute.label.toLowerCase().includes(name) || attribute.short.toLowerCase() === name.slice(0, 3)));
  return found?.value ?? 0;
};

const skillValue = (skills: SheetSkill[], names: string[]) => {
  const found = skills.find(skill => names.some(name => skill.name.toLowerCase().includes(name)));
  if (!found) return 0;
  // Fichas antigas usam value como bônus manual. O treinamento garante pelo menos +5.
  return found.trained ? Math.max(5, found.value) : found.value;
};

export const derivedStats = (sheet: Sheet): DerivedStats => ({
  defense: 10 + attributeValue(sheet.attributes, ['agilidade', 'agi']),
  initiative: attributeValue(sheet.attributes, ['agilidade', 'agi']) + skillValue(sheet.skills, ['iniciativa']),
  perception: attributeValue(sheet.attributes, ['presença', 'pre']) + skillValue(sheet.skills, ['percepção', 'percepcao']),
  load: 5 + attributeValue(sheet.attributes, ['força', 'forca', 'for']),
});

const d20 = () => 1 + Math.floor(Math.random() * 20);
const signed = (value: number) => value >= 0 ? `+${value}` : String(value);

const result = (expr: string, total: number, by: string, detail: string): Roll => ({
  expr,
  total,
  by,
  at: Date.now(),
  detail,
});

export const rollAttribute = (sheet: Sheet, attribute: SheetAttribute): Roll => {
  const die = d20();
  return result(`d20 ${signed(attribute.value)}`, die + attribute.value, sheet.name, `${attribute.label}: ${die} ${signed(attribute.value)}`);
};

export const rollSkill = (sheet: Sheet, skill: SheetSkill): Roll => {
  const die = d20();
  const modifier = skill.trained ? Math.max(5, skill.value) : skill.value;
  return result(`d20 ${signed(modifier)}`, die + modifier, sheet.name, `${skill.name}: ${die} ${signed(modifier)}`);
};

export const rollDerived = (sheet: Sheet, label: 'iniciativa' | 'percepção'): Roll => {
  const stats = derivedStats(sheet);
  const modifier = label === 'iniciativa' ? stats.initiative : stats.perception;
  const die = d20();
  return result(`d20 ${signed(modifier)}`, die + modifier, sheet.name, `${label}: ${die} ${signed(modifier)}`);
};
