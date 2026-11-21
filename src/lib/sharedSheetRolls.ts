import type { SheetRoll } from './sheets';

export interface SharedRollCursor {
  initialized: boolean;
  lastSeenKey: string | null;
}

export interface SharedRollObservation {
  cursor: SharedRollCursor;
  rollToAnimate: SheetRoll | null;
}

const rollKey = (roll: SheetRoll): string => JSON.stringify([
  roll.at,
  roll.expr,
  roll.total,
  roll.by,
  roll.detail ?? '',
]);

/** Treat the first snapshot as a baseline; later compare the whole result, not only its clock. */
export const observeSharedRoll = (
  cursor: SharedRollCursor,
  latest: SheetRoll | null | undefined,
): SharedRollObservation => {
  const latestKey = latest ? rollKey(latest) : null;

  if (!cursor.initialized) {
    return {
      cursor: { initialized: true, lastSeenKey: latestKey },
      rollToAnimate: null,
    };
  }

  if (!latest || latestKey === cursor.lastSeenKey) {
    return { cursor, rollToAnimate: null };
  }

  return {
    cursor: { initialized: true, lastSeenKey: latestKey },
    rollToAnimate: latest,
  };
};
