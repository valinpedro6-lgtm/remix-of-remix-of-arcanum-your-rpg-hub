import { useCallback, useEffect, useState } from 'react';
import { Check, Handshake, Percent, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { callGate } from '@/lib/access';

type Affiliate = { id: string; name: string; code: string; discount_percent: number; commission_percent: number; active: boolean };
type Sale = { id: string; plan: 'vitalicio' | 'mensal'; gross_amount_cents: number; discount_percent: number; net_amount_cents: number; affiliate_code: string; commission_percent: number; commission_amount_cents: number; status: 'pending' | 'approved' | 'rejected'; created_at: string };
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const empty = { name: '', code: '', discountPercent: '10', commissionPercent: '30' };

export const AffiliateManager = ({ master }: { master: string }) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [affiliateRes, salesRes] = await Promise.all([callGate({ action: 'affiliates-list', master }), callGate({ action: 'sales-list', master })]);
    if (affiliateRes?.ok) setAffiliates((affiliateRes.affiliates ?? []) as Affiliate[]);
    if (salesRes?.ok) setSales((salesRes.sales ?? []) as Sale[]);
  }, [master]);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await callGate({ action: 'affiliate-save', master, id: editingId, name: draft.name, code: draft.code, discountPercent: Number(draft.discountPercent), commissionPercent: Number(draft.commissionPercent), active: true });
      if (!result?.ok) { toast({ title: 'Não foi possível salvar', description: String(result?.error ?? 'Confira os campos.'), variant: 'destructive' }); return; }
      toast({ title: editingId ? 'Afiliado atualizado' : 'Afiliado criado' }); setDraft(empty); setEditingId(''); await load();
    } catch { toast({ title: 'Erro ao salvar afiliado', variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Excluir este afiliado? Vendas antigas continuam registradas.')) return;
    await callGate({ action: 'affiliate-delete', master, id }); await load();
  };
  const setStatus = async (sale: Sale, status: Sale['status']) => {
    setBusy(true);
    try { const result = await callGate({ action: 'sale-status', master, id: sale.id, status }); if (result?.ok) { toast({ title: status === 'approved' ? 'Venda aprovada' : status === 'rejected' ? 'Venda rejeitada' : 'Venda reaberta' }); await load(); } }
    finally { setBusy(false); }
  };
  return <div className="space-y-4">
    <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-xl"><Handshake className="h-5 w-5 text-primary" /> Afiliados e cupons</CardTitle><p className="text-sm text-muted-foreground">O desconto é aplicado primeiro. A comissão fica calculada sobre o valor líquido pago.</p></CardHeader><CardContent className="space-y-4">
      <form onSubmit={save} className="grid gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 md:grid-cols-[1.2fr_1fr_110px_110px_auto] md:items-end"><label className="text-xs font-semibold text-muted-foreground">Nome<input className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Ex.: João" /></label><label className="text-xs font-semibold text-muted-foreground">Código<input className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm uppercase text-foreground" value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="JOAO10" maxLength={32} /></label><label className="text-xs font-semibold text-muted-foreground">Desconto %<input type="number" min="0" max="100" className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={draft.discountPercent} onChange={e => setDraft({ ...draft, discountPercent: e.target.value })} /></label><label className="text-xs font-semibold text-muted-foreground">Comissão %<input type="number" min="0" max="100" className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={draft.commissionPercent} onChange={e => setDraft({ ...draft, commissionPercent: e.target.value })} /></label><Button type="submit" disabled={busy || !draft.name || !draft.code}><Save className="mr-1 h-4 w-4" />{editingId ? 'Salvar' : 'Adicionar'}</Button></form>
      {affiliates.length === 0 ? <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Nenhum afiliado cadastrado.</p> : <div className="divide-y divide-border/40 rounded-lg border border-border/40">{affiliates.map(affiliate => <div key={affiliate.id} className="flex flex-wrap items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="font-semibold">{affiliate.name} <Badge variant="outline" className="ml-1 font-mono">{affiliate.code}</Badge></p><p className="text-xs text-muted-foreground">{affiliate.discount_percent}% de desconto · {affiliate.commission_percent}% de comissão sobre o líquido</p></div><Button size="icon" variant="ghost" onClick={() => { setEditingId(affiliate.id); setDraft({ name: affiliate.name, code: affiliate.code, discountPercent: String(affiliate.discount_percent), commissionPercent: String(affiliate.commission_percent) }); }}><Save className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(affiliate.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
    </CardContent></Card>
    <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-xl"><Percent className="h-5 w-5 text-primary" /> Vendas e comissões</CardTitle><p className="text-sm text-muted-foreground">Aprove somente depois de confirmar o pagamento no WhatsApp.</p></CardHeader><CardContent>{sales.length === 0 ? <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Nenhuma venda registrada.</p> : <div className="space-y-2">{sales.map(sale => <div key={sale.id} className="rounded-xl border border-border/50 bg-background/25 p-3"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">Pro {sale.plan} {sale.affiliate_code && <Badge variant="outline" className="ml-1 font-mono">{sale.affiliate_code}</Badge>}</p><p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleString('pt-BR')} · {sale.discount_percent}% desconto · pago: <strong className="text-foreground">{money(sale.net_amount_cents)}</strong></p><p className="mt-1 text-sm">Comissão prevista: <strong className="text-primary">{money(sale.commission_amount_cents)}</strong> ({sale.commission_percent}%)</p></div><Badge variant={sale.status === 'approved' ? 'default' : sale.status === 'rejected' ? 'destructive' : 'secondary'}>{sale.status === 'approved' ? 'Aprovada' : sale.status === 'rejected' ? 'Rejeitada' : 'Pendente'}</Badge></div>{sale.status !== 'approved' && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => setStatus(sale, 'approved')} disabled={busy}><Check className="mr-1 h-4 w-4" /> Aprovar pagamento</Button><Button size="sm" variant="outline" onClick={() => setStatus(sale, 'rejected')} disabled={busy}><X className="mr-1 h-4 w-4" /> Rejeitar</Button></div>}{sale.status === 'approved' && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setStatus(sale, 'pending')} disabled={busy}>Reabrir venda</Button>}</div>)}</div>}</CardContent></Card>
  </div>;
};
