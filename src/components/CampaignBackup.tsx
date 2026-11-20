import { useEffect, useRef, useState } from 'react';
import { Archive, Download, Smartphone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  collectCampaignBackupData,
  collectCampaignDrafts,
  createCampaignBackup,
  parseCampaignBackup,
  restoreCampaignBackup,
} from '@/lib/campaignBackup';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
    try {
      const data = collectCampaignBackupData(localStorage);
      const drafts = collectCampaignDrafts(localStorage);
      if (!Object.keys(data).length && !drafts.length) {
        toast.info('Ainda não há dados locais da campanha para salvar.');
        return;
      }

      const now = new Date();
      const backup = createCampaignBackup(data, now.toISOString(), drafts);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `arcanum-backup-local-${now.toISOString().slice(0, 10)}.json`;
      anchor.style.display = 'none';
      try {
        document.body.appendChild(anchor);
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      toast.success('Backup local baixado.');
    } catch {
      toast.error('Não foi possível gerar o backup local neste navegador.');
    }
  };

  const importCampaign = async (file: File) => {
    try {
      const parsed = parseCampaignBackup(JSON.parse(await file.text()) as unknown);
      const backupDate = new Date(parsed.exportedAt).toLocaleString('pt-BR');
      const itemCount = parsed.entries.length + parsed.drafts.length;
      const restoreDescription = parsed.restoreMode === 'replace'
        ? 'Os dados locais listados e os rascunhos incluídos serão restaurados como estavam no arquivo.'
        : 'Este backup antigo aplicará os dados presentes sem apagar outros dados locais.';
      const confirmed = window.confirm(
        `Backup de ${backupDate}, com ${itemCount} itens locais. ${restoreDescription} Credenciais e dados da nuvem não serão alterados. Continuar?`,
      );
      if (!confirmed) return;

      restoreCampaignBackup(localStorage, parsed);
      toast.success('Backup local restaurado. Recarregando...');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não consegui importar esse backup local.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const install = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') toast.success('ARCANUM instalada como aplicativo.');
    } catch {
      toast.error('Não foi possível iniciar a instalação neste navegador.');
    } finally {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="mobile-backup-tools w-full min-w-0 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Archive className="h-4 w-4 shrink-0 text-primary" /> Backup local
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="min-w-0 gap-1.5 text-xs" onClick={exportCampaign}>
          <Download className="h-3.5 w-3.5 shrink-0" /> <span>Baixar</span>
        </Button>
        <Button variant="outline" size="sm" className="min-w-0 gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 shrink-0" /> <span>Restaurar</span>
        </Button>
      </div>
      {installPrompt && (
        <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs" onClick={install}>
          <Smartphone className="h-3.5 w-3.5" /> Instalar aplicativo
        </Button>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={event => {
        const file = event.target.files?.[0];
        if (file) void importCampaign(file);
      }} aria-label="Selecionar arquivo de backup local" />
      <p className="text-[11px] leading-relaxed text-muted-foreground/75">Inclui dados e rascunhos locais selecionados e preferências. Não inclui fichas/tabletop sincronizados na nuvem nem credenciais.</p>
    </div>
  );
};
