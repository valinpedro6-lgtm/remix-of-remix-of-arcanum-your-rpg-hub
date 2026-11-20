import { describe, expect, it } from 'vitest';
import {
  BackupStorage,
  collectCampaignBackupData,
  collectCampaignDrafts,
  createCampaignBackup,
  parseCampaignBackup,
  restoreCampaignBackup,
} from '@/lib/campaignBackup';

class MemoryStorage implements BackupStorage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class FailingStorage extends MemoryStorage {
  setItem(key: string, value: string): void {
    if (key === 'arcanum-monsters' && value === 'novo') throw new Error('quota');
    super.setItem(key, value);
  }
}

const exportedAt = '2026-11-20T20:00:00.000Z';

describe('backup local da campanha', () => {
  it('coleta apenas as chaves locais permitidas, incluindo tema e modelos', () => {
    const storage = new MemoryStorage();
    storage.setItem('arcanum-notes', '["nota"]');
    storage.setItem('arcanum-theme', '"purple"');
    storage.setItem('arcanum-sheet-templates-v1', '{"models":[]}');
    storage.setItem('arcanum-owner-token', 'não exportar');

    expect(collectCampaignBackupData(storage)).toEqual({
      'arcanum-notes': '["nota"]',
      'arcanum-sheet-templates-v1': '{"models":[]}',
      'arcanum-theme': '"purple"',
    });
  });

  it('gera backup v2 com manifesto e restaura removendo somente chaves ausentes do backup', () => {
    const storage = new MemoryStorage();
    storage.setItem('arcanum-notes', 'antigas');
    storage.setItem('arcanum-monsters', 'monstros antigos');
    storage.setItem('arcanum-owner-token', 'credencial preservada');
    storage.setItem('arcanum-access-granted', 'true');

    const file = createCampaignBackup({ 'arcanum-notes': 'novas' }, exportedAt);
    expect(file.version).toBe(2);
    expect(file.includedKeys).toContain('arcanum-theme');
    const parsed = parseCampaignBackup(file);
    restoreCampaignBackup(storage, parsed);

    expect(storage.getItem('arcanum-notes')).toBe('novas');
    expect(storage.getItem('arcanum-monsters')).toBeNull();
    expect(storage.getItem('arcanum-owner-token')).toBe('credencial preservada');
    expect(storage.getItem('arcanum-access-granted')).toBe('true');
  });

  it('filtra chaves não permitidas ao serializar o arquivo', () => {
    const file = createCampaignBackup({
      'arcanum-notes': 'nota',
      'arcanum-owner-token': 'não exportar',
    }, exportedAt);

    expect(file.data).toEqual({ 'arcanum-notes': 'nota' });
  });

  it('exporta rascunhos sem expor o token e os associa ao token local ao restaurar', () => {
    const source = new MemoryStorage();
    const ownerToken = 'token-privado-da-origem';
    const draft = JSON.stringify({ savedAt: 123, value: { name: 'Rascunho local' } });
    source.setItem('arcanum-owner-token', ownerToken);
    source.setItem(`arcanum-draft:${ownerToken}:sheet:ficha-123`, draft);
    source.setItem('arcanum-draft:outro-token:sheet:outra-ficha', draft);

    const file = createCampaignBackup({}, exportedAt, collectCampaignDrafts(source));
    expect(file.drafts).toEqual([{ kind: 'sheet', id: 'ficha-123', data: draft }]);
    expect(JSON.stringify(file)).not.toContain(ownerToken);

    const destination = new MemoryStorage();
    destination.setItem('arcanum-owner-token', 'token-atual');
    destination.setItem('arcanum-draft:token-atual:tabletop:rascunho-antigo', draft);
    destination.setItem('arcanum-notes', 'notas existentes');
    destination.setItem('arcanum-monsters', 'monstros existentes');
    expect(file.includedKeys).toEqual([]);
    restoreCampaignBackup(destination, parseCampaignBackup(file));

    expect(destination.getItem('arcanum-draft:token-atual:sheet:ficha-123')).toBe(draft);
    expect(destination.getItem('arcanum-draft:token-atual:tabletop:rascunho-antigo')).toBeNull();
    expect(destination.getItem('arcanum-owner-token')).toBe('token-atual');
    expect(destination.getItem('arcanum-notes')).toBe('notas existentes');
    expect(destination.getItem('arcanum-monsters')).toBe('monstros existentes');
  });

  it('não aplica dados v2 que não constam no manifesto', () => {
    const storage = new MemoryStorage();
    storage.setItem('arcanum-notes', 'notas existentes');
    storage.setItem('arcanum-monsters', 'monstros existentes');
    const parsed = parseCampaignBackup({
      app: 'arcanum',
      version: 2,
      exportedAt,
      includedKeys: ['arcanum-notes'],
      data: { 'arcanum-notes': 'notas restauradas', 'arcanum-monsters': 'não aplicar' },
      drafts: [],
    });

    restoreCampaignBackup(storage, parsed);

    expect(storage.getItem('arcanum-notes')).toBe('notas restauradas');
    expect(storage.getItem('arcanum-monsters')).toBe('monstros existentes');
  });

  it('importa backups v1 existentes como mesclagem, sem apagar chaves ausentes', () => {
    const storage = new MemoryStorage();
    storage.setItem('arcanum-notes', 'nota atual');
    storage.setItem('arcanum-monsters', 'monstros atuais');

    const legacy = parseCampaignBackup({
      app: 'arcanum',
      version: 1,
      exportedAt,
      data: { 'arcanum-notes': 'nota do backup' },
    });
    expect(legacy.restoreMode).toBe('merge');
    restoreCampaignBackup(storage, legacy);

    expect(storage.getItem('arcanum-notes')).toBe('nota do backup');
    expect(storage.getItem('arcanum-monsters')).toBe('monstros atuais');
  });

  it('ignora chaves não permitidas e rejeita arquivos sem dados locais válidos', () => {
    expect(() => parseCampaignBackup({
      app: 'arcanum',
      version: 2,
      exportedAt,
      includedKeys: ['arcanum-notes'],
      data: { 'arcanum-owner-token': 'segredo' },
    })).toThrow('não contém dados locais reconhecidos');
  });

  it('reverte as alterações locais se uma gravação falhar durante a restauração', () => {
    const storage = new FailingStorage();
    storage.setItem('arcanum-notes', 'nota antiga');
    storage.setItem('arcanum-monsters', 'monstros antigos');
    const parsed = parseCampaignBackup(createCampaignBackup({
      'arcanum-notes': 'nota nova',
      'arcanum-monsters': 'novo',
    }, exportedAt));

    expect(() => restoreCampaignBackup(storage, parsed)).toThrow('quota');
    expect(storage.getItem('arcanum-notes')).toBe('nota antiga');
    expect(storage.getItem('arcanum-monsters')).toBe('monstros antigos');
  });
});
