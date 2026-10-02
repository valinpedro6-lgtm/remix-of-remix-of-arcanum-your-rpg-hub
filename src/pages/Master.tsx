import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Copy, RefreshCw, Mail, Users, Radio, Loader2, LogOut, KeyRound, Trash2, Search, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { MASTER_KEY, callGate, becomeMaster, leaveMaster } from '@/lib/access';

interface Session { device_id: string; label: string; first_seen: string; last_seen: string }

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const mailto = (to: string | string[], subject = 'Arcanum — mensagem do mestre') => {
  const list = Array.isArray(to) ? to.join(',') : to;
  return `mailto:${list}?subject=${encodeURIComponent(subject)}`;
};

const Master = () => {
  const navigate = useNavigate();
  const [master, setMaster] = useState(() => localStorage.getItem(MASTER_KEY) ?? '');
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(!!master);
  const [pwd, setPwd] = useState('');
  const [current, setCurrent] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [info, setInfo] = useState({ total: 0, active: 0 });
  const [custom, setCustom] = useState('');
  const [newMaster, setNewMaster] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (key: string) => {
    const res = await callGate({ action: 'stats', master: key });
    if (!res?.ok) return false;
    setCurrent(res.currentCode);
    setSessions(res.sessions ?? []);
    setInfo({ total: res.total ?? 0, active: res.active ?? 0 });
    return true;
  }, []);

  useEffect(() => {
    if (!master) return;
    load(master).then(ok => {
      if (ok) setReady(true);
      else { leaveMaster(); setMaster(''); }
    }).catch(() => {}).finally(() => setChecking(false));
  }, [master, load]);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => load(master).catch(() => {}), 15000);
    return () => clearInterval(id);
  }, [ready, master, load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) return;
    setBusy(true);
    try {
      const res = await callGate({ action: 'master-status', master: pwd.trim() });
      if (res?.ok) { await becomeMaster(pwd.trim()); setMaster(pwd.trim()); setPwd(''); }
      else if (res?.locked) toast({ title: 'Bloqueado por tentativas demais', variant: 'destructive' });
      else toast({ title: 'Senha de mestre incorreta', variant: 'destructive' });
    } catch { toast({ title: 'Erro de conexão', variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const rotate = async (value?: string) => {
    setBusy(true);
    try {
      const res = await callGate({ action: 'set-code', master, code: value ?? '' });
      if (res?.ok) { setCurrent(res.currentCode); setCustom(''); toast({ title: 'Novo código gerado', description: 'O anterior não vale mais.' }); }
    } catch { toast({ title: 'Erro ao gerar código', variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const changeMaster = async () => {
    const next = newMaster.trim();
    if (next.length < 4) return toast({ title: 'A senha precisa ter pelo menos 4 caracteres', variant: 'destructive' });
    setBusy(true);
    try {
      const res = await callGate({ action: 'set-master', master, newMaster: next });
      if (res?.ok) {
        localStorage.setItem(MASTER_KEY, next);
        setMaster(next); setNewMaster('');
        toast({ title: 'Senha de mestre alterada' });
      } else toast({ title: 'Não deu para alterar', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const resetSessions = async () => {
    if (!confirm('Limpar a lista de quem entrou?')) return;
    const res = await callGate({ action: 'reset-sessions', master });
    if (res?.ok) { setSessions(res.sessions ?? []); setInfo({ total: res.total ?? 0, active: res.active ?? 0 }); }
  };

  const exit = () => { leaveMaster(); navigate('/'); };

  if (checking) {
    return <div className="flex items-center gap-2 justify-center py-20 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Abrindo área do mestre...</div>;
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto py-10">
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2"><Shield className="w-6 h-6" /></div>
              <h1 className="page-title">Área do Mestre</h1>
              <p className="text-sm text-muted-foreground">Só quem lidera a mesa tem a senha.</p>
            </div>
            <form onSubmit={login} className="space-y-3">
              <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Senha de mestre" maxLength={64} autoFocus />
              <Button type="submit" className="w-full" disabled={busy || !pwd.trim()}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const withEmail = sessions.filter(s => isEmail(s.label));
  const filtered = sessions.filter(s => !query || s.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2"><Shield className="w-7 h-7 text-primary" /> Mestre</h1>
          <p className="text-sm text-muted-foreground">Códigos de acesso e quem entrou na mesa</p>
        </div>
        <Button variant="ghost" size="sm" onClick={exit}><LogOut className="w-4 h-4 mr-1" /> Sair do modo mestre</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card md:col-span-1">
          <CardContent className="p-5 space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Código atual</p>
            <motion.p key={current} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-4xl font-display font-bold tracking-[0.2em] text-primary text-center py-2 break-all">{current}</motion.p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard?.writeText(current); toast({ title: 'Código copiado' }); }}>
                <Copy className="w-4 h-4 mr-1" /> Copiar
              </Button>
              <Button className="flex-1" onClick={() => rotate()} disabled={busy}><RefreshCw className="w-4 h-4 mr-1" /> Gerar</Button>
            </div>
            <div className="flex gap-2">
              <Input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Código personalizado" maxLength={32} />
              <Button variant="secondary" onClick={() => custom.trim() && rotate(custom.trim())} disabled={busy || !custom.trim()}>Definir</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">O código se renova sozinho quando alguém entra. Cada novo código invalida o anterior.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 md:col-span-2 content-start">
          <Card className="glass-card"><CardContent className="p-5">
            <Radio className="w-5 h-5 text-primary mb-2" />
            <p className="text-3xl font-display font-bold">{info.active}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Na mesa agora</p>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-5">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-3xl font-display font-bold">{info.total}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Já entraram</p>
          </CardContent></Card>
          <Card className="glass-card col-span-2"><CardContent className="p-5 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Trocar senha de mestre</p>
            <div className="flex gap-2">
              <Input type="password" value={newMaster} onChange={e => setNewMaster(e.target.value)} placeholder="Nova senha" maxLength={64} />
              <Button variant="secondary" onClick={changeMaster} disabled={busy || !newMaster.trim()}>Salvar</Button>
            </div>
          </CardContent></Card>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold flex items-center gap-2 mr-auto"><Mail className="w-5 h-5 text-primary" /> Quem entrou</h2>
            {withEmail.length > 0 && (
              <Button asChild size="sm">
                <a href={mailto(withEmail.map(s => s.label))}><Send className="w-4 h-4 mr-1" /> E-mail para todos</a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => load(master)}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
            <Button size="sm" variant="ghost" onClick={resetSessions}><Trash2 className="w-4 h-4" /></Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar e-mail" className="pl-9" />
          </div>
          <div className="divide-y divide-border/30 rounded-lg border border-border/40">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Ninguém entrou ainda.</p>
            ) : filtered.map(sn => {
              const online = Date.now() - new Date(sn.last_seen).getTime() < 2 * 60_000;
              const email = isEmail(sn.label) ? sn.label : '';
              return (
                <div key={sn.device_id} className="flex items-center gap-3 px-3 py-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                  <div className="flex-1 min-w-0">
                    {email ? (
                      <a href={mailto(email)} className="font-medium truncate block hover:text-primary hover:underline" title="Enviar e-mail">{email}</a>
                    ) : (
                      <span className="font-medium truncate block text-muted-foreground">{sn.label || 'sem e-mail'}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {online ? 'Online agora' : `Visto ${fmtDate(sn.last_seen)}`} · entrou {fmtDate(sn.first_seen)}
                    </span>
                  </div>
                  {email && (
                    <div className="flex gap-1 shrink-0">
                      <Button asChild size="icon" variant="ghost" className="h-9 w-9">
                        <a href={mailto(email)} aria-label={`Enviar e-mail para ${email}`}><Mail className="w-4 h-4" /></a>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Copiar e-mail"
                        onClick={() => { navigator.clipboard?.writeText(email); toast({ title: 'E-mail copiado' }); }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Master;
