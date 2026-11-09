import { useEffect, useRef, useState } from 'react';
import { Archive, Download, Smartphone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CAMPAIGN_KEYS = [
  'arcanum-calendar', 'arcanum-current-region', 'arcanum-current-weather', 'arcanum-dice-history',
  'arcanum-environment', 'arcanum-event-overrides', 'arcanum-extra-timers', 'arcanum-initiative',
  'arcanum-initiative-round', 'arcanum-initiative-turn', 'arcanum-loot-favorites', 'arcanum-loot-history',
  'arcanum-mindmap', 'arcanum-mindmap-active', 'arcanum-mindmaps', 'arcanum-monster-templates',
  'arcanum-monsters', 'arcanum-notes', 'arcanum-npcs', 'arcanum-player-templates', 'arcanum-players',
  'arcanum-potions', 'arcanum-potions-overrides', 'arcanum-sheet-system', 'arcanum-spells',
  'arcanum-tesouro', 'arcanum-time-of-day', 'arcanum-timer', 'arcanum-weapons-custom',
  'arcanum-weapons-overrides', 'arcanum-weather-overrides',
] as const;

interface CampaignBackupFile {
  app: 'arcanum';
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isBackupFile = (value: unknown): value is CampaignBackupFile => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CampaignBackupFile>;
  return candidate.app === 'arcanum' && candidate.version === 1 && typeof candidate.data === 'object' && candidate.data !== null;
};

export const CampaignBackup = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const exportCampaign = () => {
    const data: Record<string, string> = {};
    CAMPAIGN_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    });
    const backup: CampaignBackupFile = { app: 'arcanum', version: 1, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `arcanum-campanha-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Backup da campanha baixado.');
  };

  const importCampaign = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackupFile(parsed)) throw new Error('arquivo inválido');
      const entries = Object.entries(parsed.data).filter(([key, value]) => CAMPAIGN_KEYS.includes(key as typeof CAMPAIGN_KEYS[number]) && typeof value === 'string');
      if (!entries.length) throw new Error('backup vazio');
      if (!confirm(`Importar ${entries.length} dados da campanha? Isso substituirá os dados locais atuais.`)) return;
      entries.forEach(([key, value]) => localStorage.setItem(key, value));
      toast.success('Campanha restaurada. Recarregando...');
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error('Não consegui importar esse arquivo. Use um backup JSON da ARCANUM.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') toast.success('ARCANUM instalada como aplicativo.');
    setInstallPrompt(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Archive className="w-3.5 h-3.5 text-primary" /> Backup da campanha
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCampaign}>
          <Download className="w-3.5 h-3.5" /> Baixar
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> Restaurar
        </Button>
      </div>
      {installPrompt && (
        <Button variant="secondary" size="sm" className="w-full text-xs gap-1.5" onClick={install}>
          <Smartphone className="w-3.5 h-3.5" /> Instalar aplicativo
        </Button>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={event => {
        const file = event.target.files?.[0];
        if (file) void importCampaign(file);
      }} />
      <p className="text-[10px] leading-relaxed text-muted-foreground/70">Inclui dados locais da campanha. Senhas, tokens e acesso não entram no arquivo.</p>
    </div>
  );
};
