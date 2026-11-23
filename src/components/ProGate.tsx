import { ReactNode, useState } from 'react';
import { LockKeyhole, MessageCircle, KeyRound, Loader2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { callGate, deviceId } from '@/lib/access';
import { currentOwnerToken, setOwnerToken } from '@/lib/userData';

export const PRO_KEY = 'arcanum-pro-unlocked';
const WHATSAPP_NUMBER = '5518997999210';

type Plan = 'vitalicio' | 'mensal';

const planDetails: Record<Plan, { label: string; price: string; helper: string }> = {
  vitalicio: { label: 'Pro vitalício', price: 'R$ 32,90', helper: 'Pagamento único, acesso permanente' },
  mensal: { label: 'Pro mensal', price: 'R$ 22,90', helper: 'Acesso Pro por 30 dias' },
};

export const isProUnlocked = () => localStorage.getItem(PRO_KEY) === 'true';

const openWhatsApp = (plan: Plan) => {
  const details = planDetails[plan];
  const message = `Olá! Tenho interesse no plano ${details.label} do Arcanum (${details.price}). Gostaria de receber as instruções para pagamento e ativação do meu acesso Pro.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
};

export const ProPricingDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-display text-2xl"><Sparkles className="h-5 w-5 text-primary" /> Desbloqueie o Arcanum Pro</DialogTitle>
        <DialogDescription>Escolha seu plano. Ao clicar, o WhatsApp abre com uma mensagem pronta para falar com o mestre.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.entries(planDetails) as [Plan, typeof planDetails[Plan]][]).map(([plan, details]) => (
          <Card key={plan} className={`border-primary/25 ${plan === 'vitalicio' ? 'bg-primary/8 shadow-[0_0_30px_hsl(var(--primary)/0.12)]' : 'bg-card/60'}`}>
            <CardHeader className="pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{plan === 'vitalicio' ? 'Mais escolhido' : 'Flexível'}</p>
              <CardTitle className="font-display text-xl">{details.label}</CardTitle>
              <p className="text-3xl font-black text-foreground">{details.price}</p>
              <p className="text-xs text-muted-foreground">{details.helper}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Tabletop e mesa ao vivo</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Geradores e compêndio</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Ferramentas avançadas</p></div>
              <Button className="w-full gap-2" onClick={() => openWhatsApp(plan)}><MessageCircle className="h-4 w-4" /> Tenho interesse</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">Depois do pagamento, você recebe um código para ativar o Pro neste aparelho.</p>
    </DialogContent>
  </Dialog>
);

export const ProAccessCard = ({ onUnlocked }: { onUnlocked?: () => void }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const result = await callGate({ action: 'verify', code: code.trim(), device: deviceId(), oldToken: currentOwnerToken() });
      if (!result?.ok) {
        toast({ title: 'Código inválido', description: 'Confira o código enviado pelo mestre.', variant: 'destructive' });
        return;
      }
      if (result.token) setOwnerToken(result.token);
      localStorage.setItem(PRO_KEY, 'true');
      window.dispatchEvent(new Event('arcanum-pro-change'));
      toast({ title: 'Pro ativado', description: 'Todos os recursos pagos estão liberados neste aparelho.' });
      onUnlocked?.();
    } catch {
      toast({ title: 'Não foi possível validar agora', description: 'Confira sua conexão e tente novamente.', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  return <>
    <Card className="mx-auto max-w-xl overflow-hidden border-primary/30 bg-card/70 shadow-[0_0_50px_hsl(var(--primary)/0.12)]">
      <CardContent className="p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary"><LockKeyhole className="h-7 w-7" /></div>
        <p className="eyebrow">Recurso Pro</p><h2 className="mt-2 font-display text-3xl font-black">Este espaço é do mestre</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Tabletop, geradores, compêndio e as ferramentas avançadas ficam disponíveis com o Arcanum Pro.</p>
        <Button className="mt-6 gap-2" onClick={() => setPricingOpen(true)}><Sparkles className="h-4 w-4" /> Obter Pro</Button>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground/70"><span className="h-px flex-1 bg-border" /> Já tenho um código <span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={unlock} className="mx-auto flex max-w-sm gap-2"><Input type="password" value={code} onChange={event => setCode(event.target.value)} placeholder="Código de ativação" maxLength={64} /><Button type="submit" variant="secondary" disabled={loading || !code.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}</Button></form>
      </CardContent>
    </Card>
    <ProPricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
  </>;
};

export const ProGate = ({ children }: { children: ReactNode }) => {
  const [unlocked, setUnlocked] = useState(isProUnlocked);
  if (unlocked) return <>{children}</>;
  return <div className="py-6"><ProAccessCard onUnlocked={() => setUnlocked(true)} /></div>;
};
