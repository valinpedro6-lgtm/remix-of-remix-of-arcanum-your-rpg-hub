import { describe, expect, it } from 'vitest';
import type { Sheet, SheetSkill } from '@/lib/sheets';
import { derivedStats, rollDerived, rollSkill, skillDisplayValue } from '@/lib/sheetAutomation';

const makeSheet = (system = 'ordemparanormal', skills: SheetSkill[] = []): Sheet => ({
  id: 'test-sheet',
  kind: 'player',
  style: { system },
  name: 'Personagem de teste',
  subtitle: '',
  origin: '',
  image_url: '',
  accent: 'red',
  attributes: [
    { id: 'agi', label: 'Agilidade', short: 'AGI', value: 1 },
    { id: 'pre', label: 'Presença', short: 'PRE', value: 2 },
  ],
  skills,
  resources: [],
  abilities: [],
  level: 1,
  xp: 0,
  xp_goal: 100,
  initiative: 0,
  notes: '',
  in_list: false,
  share_id: 'test-share',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

const initiativeSkill: SheetSkill = {
  id: 'initiative',
  name: 'Iniciativa',
  value: 0,
  trained: true,
  degree: 'treinado',
  attribute: 'AGI',
};

const perceptionSkill: SheetSkill = {
  id: 'perception',
  name: 'Percepção',
  value: 0,
  trained: true,
  degree: 'treinado',
  attribute: 'PRE',
};

describe('automação da ficha de Ordem Paranormal', () => {
  it('não soma Agilidade ou Presença como bônus fixo de iniciativa e percepção', () => {
    const sheet = makeSheet('ordemparanormal', [initiativeSkill, perceptionSkill]);
    const stats = derivedStats(sheet);

    expect(stats.find(stat => stat.id === 'initiative')?.value).toBe(5);
    expect(stats.find(stat => stat.id === 'perception')?.value).toBe(5);
  });

  it('usa o grau da perícia e respeita os graus Veterano e Expert', () => {
    const sheet = makeSheet();

    expect(skillDisplayValue(sheet, { ...initiativeSkill, degree: 'treinado' })).toBe(5);
    expect(skillDisplayValue(sheet, { ...initiativeSkill, degree: 'veterano' })).toBe(10);
    expect(skillDisplayValue(sheet, { ...initiativeSkill, degree: 'expert' })).toBe(15);
  });

  it('mantém compatibilidade com fichas antigas em que treinado está marcado, mas o grau ainda diz destreinado', () => {
    const sheet = makeSheet();

    expect(skillDisplayValue(sheet, { ...initiativeSkill, degree: 'destreinado', trained: true })).toBe(5);
  });

  it('mostra o mesmo bônus na perícia e nas rolagens de Iniciativa e Percepção', () => {
    const sheet = makeSheet('ordemparanormal', [initiativeSkill, perceptionSkill]);

    expect(rollSkill(sheet, initiativeSkill).expr).toContain('+5');
    expect(rollDerived(sheet, 'initiative').expr).toContain('+5');
    expect(rollDerived(sheet, 'perception').expr).toContain('+5');
  });

  it('não transforma toda perícia treinada de outros sistemas em bônus mínimo +5', () => {
    const sheet = makeSheet('dnd5e', [{ ...initiativeSkill, trained: true, value: 0 }]);

    expect(skillDisplayValue(sheet, sheet.skills[0])).toBe(0);
  });
});
