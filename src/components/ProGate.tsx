import { ReactNode, useState } from 'react';
import { LockKeyhole, MessageCircle, KeyRound, Loader2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { callGate, deviceId, GRANT_KEY } from '@/lib/access';
import { currentOwnerToken, setOwnerToken } from '@/lib/userData';

export const PRO_KEY = 'arcanum-pro-unlocked';
const WHATSAPP_NUMBER = '5518997999210';

type Plan = 'vitalicio' | 'mensal';

const planDetails: Record<Plan, { label: string; price: string; helper: string }> = {
  vitalicio: { label: 'Pro vitalício', price: 'R$ 32,90', helper: 'Pagamento único, acesso permanente' },
  mensal: { label: 'Pro mensal', price: 'R$ 22,90', helper: 'Acesso Pro por 30 dias' },
};
const planPricesCents: Record<Plan, number> = { vitalicio: 3290, mensal: 2290 };

export const isProUnlocked = () =>
  localStorage.getItem(PRO_KEY) === 'true' || localStorage.getItem(GRANT_KEY) === 'true';

const formatMoney = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const openWhatsApp = (plan: Plan, quote: { netAmountCents: number; affiliateCode: string; discountPercent: number; saleId?: string }) => {
  const details = planDetails[plan];
  const couponLine = quote.affiliateCode ? ` Código de afiliado: ${quote.affiliateCode} (${quote.discountPercent}% de desconto).` : '';
  const saleLine = quote.saleId ? ` Referência da venda: ${quote.saleId}.` : '';
  const message = `Olá! Tenho interesse no plano ${details.label} do Arcanum. Valor original: ${details.price}. Valor final: ${formatMoney(quote.netAmountCents)}.${couponLine}${saleLine} Gostaria de receber as instruções para pagamento e ativação do meu acesso Pro.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
};
type Quote = { netAmountCents: number; grossAmountCents: number; discountAmountCents: number; discountPercent: number; commissionPercent: number; affiliateCode: string; saleId?: string };
export const ProPricingDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [plan, setPlan] = useState<Plan>('vitalicio');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const applyCoupon = async () => {
    setLoading(true);
    try {
      const result = await callGate({ action: 'quote-sale', plan, affiliateCode });
      if (!result?.ok) { setQuote(null); toast({ title: 'Cupom não aplicado', description: String(result?.error ?? 'Confira o código.'), variant: 'destructive' }); return; }
      setQuote(result as Quote);
      toast({ title: affiliateCode.trim() ? 'Desconto aplicado' : 'Plano selecionado' });
    } catch { toast({ title: 'Não foi possível consultar o cupom', variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  const startSale = async () => {
    if (!affiliateCode.trim()) {
      openWhatsApp(plan, { netAmountCents: planPricesCents[plan], affiliateCode: '', discountPercent: 0 });
      return;
    }
    setLoading(true);
    try {
      const result = await callGate({ action: 'create-sale', plan, affiliateCode });
      if (!result?.ok) { toast({ title: 'Não foi possível registrar a venda', description: String(result?.error ?? 'Tente novamente.'), variant: 'destructive' }); return; }
      const next = result as Quote;
      setQuote(next);
      openWhatsApp(plan, next);
    } catch { toast({ title: 'Não foi possível abrir o atendimento', variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-display text-2xl"><Sparkles className="h-5 w-5 text-primary" /> Desbloqueie o Arcanum Pro</DialogTitle>
        <DialogDescription>Escolha seu plano e, se tiver, informe o código de afiliado para aplicar o desconto antes de falar com o mestre.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.entries(planDetails) as [Plan, typeof planDetails[Plan]][]).map(([planId, details]) => (
          <Card key={planId} onClick={() => { setPlan(planId); setQuote(null); }} className={`cursor-pointer border-primary/25 ${planId === 'vitalicio' ? 'bg-primary/8 shadow-[0_0_30px_hsl(var(--primary)/0.12)]' : 'bg-card/60'} ${plan === planId ? 'ring-2 ring-primary/50' : ''}`}>
            <CardHeader className="pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{planId === 'vitalicio' ? 'Mais escolhido' : 'Flexível'}</p>
              <CardTitle className="font-display text-xl">{details.label}</CardTitle>
              <p className="text-3xl font-black text-foreground">{details.price}</p>
              <p className="text-xs text-muted-foreground">{details.helper}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Tabletop e mesa ao vivo</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Geradores e compêndio</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Ferramentas avançadas</p></div>
              <Button className="w-full gap-2" variant={plan === planId ? 'default' : 'outline'} onClick={() => { setPlan(planId); setQuote(null); }}>Escolher este plano</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 bg-background/30 p-4">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Cupom de afiliado <span className="font-normal text-muted-foreground">(opcional)</span></p><span className="text-sm font-bold text-primary">{planDetails[plan].label}</span></div>
        <div className="flex gap-2"><Input value={affiliateCode} onChange={event => { setAffiliateCode(event.target.value.toUpperCase()); setQuote(null); }} placeholder="Ex.: MESTRE10" maxLength={32} /><Button variant="secondary" onClick={applyCoupon} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}</Button></div>
        {quote && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/8 px-3 py-2 text-sm"><span className="text-muted-foreground">{quote.discountPercent ? `${quote.discountPercent}% de desconto` : 'Valor do plano'}</span><span className="text-lg font-black text-primary">{formatMoney(quote.netAmountCents)}</span></div>}
        <Button className="w-full gap-2" onClick={startSale} disabled={loading}><MessageCircle className="h-4 w-4" /> Falar com o mestre no WhatsApp</Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">A venda fica pendente até o mestre confirmar o pagamento. O código Pro só é enviado após a aprovação.</p>
    </DialogContent>
  </Dialog>;
};

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
