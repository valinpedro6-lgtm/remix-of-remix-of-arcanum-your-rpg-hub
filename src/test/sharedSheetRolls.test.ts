import { describe, expect, it } from 'vitest';
import type { SheetRoll } from '@/lib/sheets';
import { observeSharedRoll } from '@/lib/sharedSheetRolls';

const savedRoll: SheetRoll = {
  expr: 'd20',
  total: 14,
  by: 'Jogador',
  at: 1000,
};

describe('rolagens em ficha compartilhada', () => {
  it('usa a rolagem salva inicial como referência, sem animá-la', () => {
    const result = observeSharedRoll({ initialized: false, lastSeenKey: null }, savedRoll);

    expect(result.rollToAnimate).toBeNull();
    expect(result.cursor).toEqual({ initialized: true, lastSeenKey: JSON.stringify([savedRoll.at, savedRoll.expr, savedRoll.total, savedRoll.by, '']) });
  });

  it('não repete a animação ao receber novamente a mesma rolagem no polling', () => {
    const result = observeSharedRoll(
      observeSharedRoll({ initialized: false, lastSeenKey: null }, savedRoll).cursor,
      { ...savedRoll },
    );

    expect(result.rollToAnimate).toBeNull();
    expect(result.cursor.lastSeenKey).toBe(JSON.stringify([savedRoll.at, savedRoll.expr, savedRoll.total, savedRoll.by, '']));
  });

  it('anima uma rolagem nova mesmo com horário igual ou atrasado, e só uma vez', () => {
    const sameTimeRoll = { ...savedRoll, total: 19 };
    const result = observeSharedRoll(
      observeSharedRoll({ initialized: false, lastSeenKey: null }, savedRoll).cursor,
      sameTimeRoll,
    );
    const olderTimeRoll = { ...savedRoll, total: 7, at: savedRoll.at - 100 };
    const olderTimeResult = observeSharedRoll(result.cursor, olderTimeRoll);
    const repeated = observeSharedRoll(olderTimeResult.cursor, { ...olderTimeRoll });

    expect(result.rollToAnimate).toEqual(sameTimeRoll);
    expect(olderTimeResult.rollToAnimate).toEqual(olderTimeRoll);
    expect(repeated.rollToAnimate).toBeNull();
  });

  it('detecta uma rolagem nova depois de um snapshot inicial sem rolagem', () => {
    const initial = observeSharedRoll({ initialized: false, lastSeenKey: null }, null);
    const next = observeSharedRoll(initial.cursor, savedRoll);

    expect(initial.rollToAnimate).toBeNull();
    expect(next.rollToAnimate).toEqual(savedRoll);
  });
});
