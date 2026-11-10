import { currentOwnerToken } from '@/lib/userData';

export type DraftKind = 'sheet' | 'tabletop';

type DraftEnvelope<T> = {
  savedAt: number;
  value: T;
};

const prefix = (kind: DraftKind, id: string) =>
  `arcanum-draft:${currentOwnerToken()}:${kind}:${id}`;

export const saveDraft = <T,>(kind: DraftKind, id: string, value: T) => {
  try {
    localStorage.setItem(prefix(kind, id), JSON.stringify({ savedAt: Date.now(), value } satisfies DraftEnvelope<T>));
  } catch {
    // O rascunho é uma proteção adicional; falhar aqui nunca deve bloquear a edição.
  }
};

export const readDraft = <T,>(kind: DraftKind, id: string, remoteUpdatedAt?: string | null) => {
  try {
    const raw = localStorage.getItem(prefix(kind, id));
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftEnvelope<T>;
    if (!draft?.savedAt || !('value' in draft)) return null;
    if (remoteUpdatedAt && draft.savedAt <= new Date(remoteUpdatedAt).getTime()) return null;
    return draft;
  } catch {
    return null;
  }
};

export const clearDraft = (kind: DraftKind, id: string) => {
  try { localStorage.removeItem(prefix(kind, id)); } catch { /* noop */ }
};
