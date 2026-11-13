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

const rollDie = (die: string | undefined, fallback = 20) => {
  const sides = Number(String(die ?? `d${fallback}`).replace('d', '')) || fallback;
  return 1 + Math.floor(Math.random() * sides);
};

const rollCount = (count: number, die: string, keep: 'highest' | 'lowest' | 'sum' = 'sum') => {
  const results = Array.from({ length: Math.max(1, count) }, () => rollDie(die));
  if (keep === 'highest') return { total: Math.max(...results), results };
  if (keep === 'lowest') return { total: Math.min(...results), results };
  return { total: results.reduce((sum, value) => sum + value, 0), results };
};

const d20 = () => rollDie('d20');
const signed = (value: number) => value >= 0 ? `+${value}` : String(value);
const result = (expr: string, total: number, by: string, detail: string): Roll => ({ expr, total, by, at: Date.now(), detail });

const degreeBonus = (degree?: string) => ({
  destreinado: 0, treinado: 5, veterano: 10, expert: 15,
  untrained: 0, trained: 2, expert_dnd: 4, master: 6, legendary: 8,
}[String(degree ?? '').toLowerCase()] ?? 0);

const dndModifier = (value: number) => Math.floor((value - 10) / 2);
const attributeForSkill = (sheet: Sheet, skill: SheetSkill) => {
  const requested = normalize(skill.attribute ?? '');
  return sheet.attributes.find(attribute => normalize(attribute.short) === requested || normalize(attribute.label) === requested)
    ?? sheet.attributes.find(attribute => normalize(attribute.label).includes(requested) && requested.length > 2);
};

export const rollAttribute = (sheet: Sheet, attribute: SheetAttribute): Roll => {
  const system = sheet.style?.system;
  if (system === 'ordemparanormal') {
    const pool = rollCount(attribute.value || 2, 'd20', attribute.value > 0 ? 'highest' : 'lowest');
    const total = pool.total + degreeBonus('treinado');
    return result(`${attribute.value || 2}d20 (maior)`, total, sheet.name, `${attribute.label}: [${pool.results.join(', ')}] → ${total}`);
  }
  if (system === 'ordemparanormal2-alpha') {
    const die = rollDie(attribute.die ?? 'd6');
    return result(`${attribute.die ?? 'd6'}`, die, sheet.name, `${attribute.label}: ${die}`);
  }
  if (system === 'cthulhu') {
    const die = rollDie('d100');
    const target = attribute.value;
    const degree = die <= Math.floor(target / 5) ? 'extremo' : die <= Math.floor(target / 2) ? 'difícil' : die <= target ? 'regular' : 'falha';
    return result(`d100 ≤ ${target}`, die, sheet.name, `${attribute.label}: ${die}/${target} (${degree})`);
  }
  if (system === 'vtm5') {
    const pool = rollCount(Math.max(1, attribute.value), 'd10');
    const successes = pool.results.filter(value => value >= 6).length;
    return result(`${attribute.value}d10`, successes, sheet.name, `${attribute.label}: [${pool.results.join(', ')}] → ${successes} sucesso(s)`);
  }
  if (system === 'shadowrun5') {
    const pool = rollCount(Math.max(1, attribute.value), 'd6');
    const hits = pool.results.filter(value => value >= 5).length;
    return result(`${attribute.value}d6`, hits, sheet.name, `${attribute.label}: [${pool.results.join(', ')}] → ${hits} hit(s)`);
  }
  if (system === 'savageworlds') {
    const trait = rollDie(attribute.die ?? 'd4');
    const wild = rollDie('d6');
    const total = Math.max(trait, wild) + (attribute.modifier ?? 0);
    return result(`${attribute.die ?? 'd4'} / Wild d6`, total, sheet.name, `${attribute.label}: ${trait}/${wild} → ${total}`);
  }
  const modifier = system === 'dnd5e' ? dndModifier(attribute.value) : (attribute.modifier ?? attribute.value);
  const die = d20();
  return result(`d20 ${signed(modifier)}`, die + modifier, sheet.name, `${attribute.label}: ${die} ${signed(modifier)}`);
};

export const rollSkill = (sheet: Sheet, skill: SheetSkill): Roll => {
  const system = sheet.style?.system;
  const linked = attributeForSkill(sheet, skill);
  const attr = linked?.value ?? 0;
  if (system === 'ordemparanormal') {
    const pool = rollCount(attr || 2, 'd20', attr > 0 ? 'highest' : 'lowest');
    const bonus = degreeBonus(skill.degree ?? (skill.trained ? 'treinado' : 'destreinado')) + (skill.modifiers ?? skill.value);
    return result(`${attr || 2}d20 (maior) ${signed(bonus)}`, pool.total + bonus, sheet.name, `${skill.name}: [${pool.results.join(', ')}] ${signed(bonus)} → ${pool.total + bonus}`);
  }
  if (system === 'ordemparanormal2-alpha') {
    const first = rollDie(linked?.die ?? 'd6');
    const skillDie = skill.die ?? skill.degree ?? 'd4';
    const second = rollDie(skillDie);
    return result(`${linked?.die ?? 'd6'}+${skillDie}`, first + second + (skill.modifiers ?? skill.value), sheet.name, `${skill.name}: ${first} + ${second} ${signed(skill.modifiers ?? skill.value)}`);
  }
  if (system === 'cthulhu') {
    const target = skill.value;
    const die = rollDie('d100');
    const degree = die <= Math.floor(target / 5) ? 'extremo' : die <= Math.floor(target / 2) ? 'difícil' : die <= target ? 'regular' : 'falha';
    return result(`d100 ≤ ${target}`, die, sheet.name, `${skill.name}: ${die}/${target} (${degree})`);
  }
  if (system === 'vtm5') {
    const poolSize = Math.max(1, attr + skill.value);
    const hunger = Math.min(poolSize, Number(skill.degree ?? 0) || 0);
    const dice = rollCount(poolSize, 'd10');
    const successes = dice.results.filter(value => value >= 6).length;
    return result(`${poolSize}d10 (${hunger} fome)`, successes, sheet.name, `${skill.name}: [${dice.results.join(', ')}] → ${successes} sucesso(s)`);
  }
  if (system === 'cpred') {
    const die = rollDie('d10');
    const total = die + attr + skill.value + (skill.modifiers ?? 0);
    return result(`d10 + ${attr} + ${skill.value}`, total, sheet.name, `${skill.name}: ${die} + ${attr} + ${skill.value} → ${total}`);
  }
  if (system === 'shadowrun5') {
    const pool = rollCount(Math.max(1, attr + skill.value), 'd6');
    const hits = pool.results.filter(value => value >= 5).length;
    return result(`${attr + skill.value}d6`, hits, sheet.name, `${skill.name}: [${pool.results.join(', ')}] → ${hits} hit(s)`);
  }
  if (system === 'savageworlds') {
    const trait = rollDie(skill.die ?? 'd4');
    const wild = rollDie('d6');
    const total = Math.max(trait, wild) + (skill.modifiers ?? 0);
    return result(`${skill.die ?? 'd4'} / Wild d6`, total, sheet.name, `${skill.name}: ${trait}/${wild} → ${total}`);
  }
  if (system === '3det') {
    const die = rollDie('d6');
    return result(`d6 + ${skill.value}`, die + skill.value, sheet.name, `${skill.name}: ${die} ${signed(skill.value)}`);
  }
  const modifier = system === 'dnd5e' ? dndModifier(attr) + (skill.degree === 'proficient' || skill.proficiency === 'proficient' ? 2 : 0) : attr + degreeBonus(skill.degree) + (skill.modifiers ?? skill.value);
  const die = d20();
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
