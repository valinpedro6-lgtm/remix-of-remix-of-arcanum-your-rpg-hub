export const CAMPAIGN_BACKUP_KEYS = [
  'arcanum-calendar', 'arcanum-current-region', 'arcanum-current-weather', 'arcanum-dice-history',
  'arcanum-environment', 'arcanum-event-overrides', 'arcanum-extra-timers', 'arcanum-initiative',
  'arcanum-initiative-inbox', 'arcanum-initiative-round', 'arcanum-initiative-turn',
  'arcanum-loot-favorites', 'arcanum-loot-history', 'arcanum-mindmap', 'arcanum-mindmap-active',
  'arcanum-mindmaps', 'arcanum-monster-templates', 'arcanum-monsters', 'arcanum-notes',
  'arcanum-npcs', 'arcanum-player-templates', 'arcanum-players', 'arcanum-potions',
  'arcanum-potions-overrides', 'arcanum-sheet-system', 'arcanum-sheet-templates-v1',
  'arcanum-spells', 'arcanum-tesouro', 'arcanum-time-of-day', 'arcanum-timer',
  'arcanum-weapons-custom', 'arcanum-weapons-overrides', 'arcanum-weather-overrides',
  'arcanum-campanha', 'arcanum-story-project-v3', 'arcanum-custom-systems',
  'arcanum-custom-tavern', 'arcanum-theme',
] as const;

export interface BackupStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

export interface CampaignBackupV1 {
  app: 'arcanum';
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
}

export type CampaignDraftKind = 'sheet' | 'tabletop';

export interface CampaignBackupDraft {
  kind: CampaignDraftKind;
  id: string;
  data: string;
}

export interface CampaignBackupV2 {
  app: 'arcanum';
  version: 2;
  exportedAt: string;
  includedKeys: string[];
  data: Record<string, string>;
  drafts: CampaignBackupDraft[];
}

export interface ParsedCampaignBackup {
  exportedAt: string;
  entries: [string, string][];
  restoreMode: 'merge' | 'replace';
  keysToReplace: string[];
  drafts: CampaignBackupDraft[];
  draftsMode: 'merge' | 'replace';
}

const allowedKeys = new Set<string>(CAMPAIGN_BACKUP_KEYS);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidDraftEnvelope = (value: string): boolean => {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) && typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt) && 'value' in parsed;
  } catch {
    return false;
  }
};

const hasControlCharacters = (value: string): boolean => [...value].some(character => {
  const code = character.charCodeAt(0);
  return code <= 0x1f || code === 0x7f;
});

const isCampaignBackupDraft = (value: unknown): value is CampaignBackupDraft => {
  if (!isRecord(value) || (value.kind !== 'sheet' && value.kind !== 'tabletop')) return false;
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 256) return false;
  if (hasControlCharacters(value.id) || typeof value.data !== 'string') return false;
  return isValidDraftEnvelope(value.data);
};

export const collectCampaignBackupData = (storage: Pick<BackupStorage, 'getItem'>): Record<string, string> => {
  const data: Record<string, string> = {};
  CAMPAIGN_BACKUP_KEYS.forEach(key => {
    const value = storage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return data;
};

export const collectCampaignDrafts = (
  storage: Pick<BackupStorage, 'getItem' | 'length' | 'key'>,
): CampaignBackupDraft[] => {
  const ownerToken = storage.getItem('arcanum-owner-token') ?? '';
  const prefix = `arcanum-draft:${ownerToken}:`;
  const drafts: CampaignBackupDraft[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const storageKey = storage.key(index);
    if (!storageKey?.startsWith(prefix)) continue;

    const suffix = storageKey.slice(prefix.length);
    const separator = suffix.indexOf(':');
    if (separator <= 0) continue;

    const candidate = {
      kind: suffix.slice(0, separator),
      id: suffix.slice(separator + 1),
      data: storage.getItem(storageKey) ?? '',
    };
    if (isCampaignBackupDraft(candidate)) drafts.push(candidate);
  }

  return drafts.sort((left, right) => `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`));
};

export const createCampaignBackup = (
  data: Record<string, string>,
  exportedAt = new Date().toISOString(),
  drafts: CampaignBackupDraft[] = [],
): CampaignBackupV2 => {
  const safeData: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.has(key) && typeof value === 'string') safeData[key] = value;
  });
  const safeDrafts = drafts.filter(isCampaignBackupDraft);

  return {
    app: 'arcanum',
    version: 2,
    exportedAt,
    includedKeys: Object.keys(safeData).length ? [...CAMPAIGN_BACKUP_KEYS] : [],
    data: safeData,
    drafts: safeDrafts,
  };
};

export const parseCampaignBackup = (value: unknown): ParsedCampaignBackup => {
  if (!isRecord(value) || value.app !== 'arcanum' || (value.version !== 1 && value.version !== 2)) {
    throw new Error('Arquivo incompatível. Selecione um backup JSON da ARCANUM.');
  }

  if (typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt)) || !isRecord(value.data)) {
    throw new Error('Arquivo de backup inválido ou incompleto.');
  }

  if (value.version === 1) {
    const entries = Object.entries(value.data)
      .filter((entry): entry is [string, string] => allowedKeys.has(entry[0]) && typeof entry[1] === 'string');
    if (!entries.length) throw new Error('Esse arquivo não contém dados locais reconhecidos da ARCANUM.');
    return {
      exportedAt: value.exportedAt,
      entries,
      restoreMode: 'merge',
      keysToReplace: [],
      drafts: [],
      draftsMode: 'merge',
    };
  }

  if (!Array.isArray(value.includedKeys) || !value.includedKeys.every(key => typeof key === 'string')) {
    throw new Error('Manifesto do backup inválido.');
  }

  const keysToReplace = [...new Set(value.includedKeys.filter((key): key is string => allowedKeys.has(key)))];

  let drafts: CampaignBackupDraft[] = [];
  let draftsMode: 'merge' | 'replace' = 'merge';
  if (value.drafts !== undefined) {
    if (!Array.isArray(value.drafts) || value.drafts.some(draft => !isCampaignBackupDraft(draft))) {
      throw new Error('Rascunhos do backup inválidos.');
    }
    drafts = value.drafts as CampaignBackupDraft[];
    draftsMode = 'replace';
  }

  const manifest = new Set(keysToReplace);
  const entries = Object.entries(value.data)
    .filter((entry): entry is [string, string] => manifest.has(entry[0]) && typeof entry[1] === 'string');

  if (!entries.length && !drafts.length) {
    throw new Error('Esse arquivo não contém dados locais reconhecidos da ARCANUM.');
  }

  return { exportedAt: value.exportedAt, entries, restoreMode: 'replace', keysToReplace, drafts, draftsMode };
};

export const restoreCampaignBackup = (storage: BackupStorage, backup: ParsedCampaignBackup): void => {
  const keysToReplace = backup.restoreMode === 'replace'
    ? [...new Set(backup.keysToReplace.filter(key => allowedKeys.has(key)))]
    : [];
  const manifest = new Set(keysToReplace);
  const safeEntries = backup.entries.filter(([key, value]) =>
    allowedKeys.has(key) && typeof value === 'string' && (backup.restoreMode === 'merge' || manifest.has(key)));
  const safeDrafts = backup.drafts.filter(isCampaignBackupDraft);
  if (!safeEntries.length && !safeDrafts.length) throw new Error('Esse backup não contém dados locais reconhecidos.');

  const ownerToken = storage.getItem('arcanum-owner-token') ?? '';
  const draftPrefix = `arcanum-draft:${ownerToken}:`;
  const currentDraftKeys = backup.restoreMode === 'replace' && backup.draftsMode === 'replace'
    ? Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => key !== null && key.startsWith(draftPrefix))
    : [];
  const restoredDraftKeys = safeDrafts.map(draft => `${draftPrefix}${draft.kind}:${draft.id}`);
  const touchedKeys = [...new Set([
    ...keysToReplace,
    ...safeEntries.map(([key]) => key),
    ...currentDraftKeys,
    ...restoredDraftKeys,
  ])];
  const previous = new Map(touchedKeys.map(key => [key, storage.getItem(key)]));

  try {
    keysToReplace.forEach(key => storage.removeItem(key));
    currentDraftKeys.forEach(key => storage.removeItem(key));
    safeEntries.forEach(([key, value]) => storage.setItem(key, value));
    safeDrafts.forEach(draft => storage.setItem(`${draftPrefix}${draft.kind}:${draft.id}`, draft.data));
  } catch (error) {
    try {
      touchedKeys.forEach(key => storage.removeItem(key));
      previous.forEach((value, key) => {
        if (value !== null) storage.setItem(key, value);
      });
    } catch {
      throw new Error('A restauração falhou e o navegador não conseguiu reverter todos os dados locais.');
    }
    throw error;
  }
};
