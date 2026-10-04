import { ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { KeyRound, Shield, Loader2, Lock, AlertTriangle, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

import { GRANT_KEY, LOCK_KEY, EMAIL_KEY, deviceId, callGate, becomeMaster, grantTestAccess, testAccessLeft, expireTestAccess } from '@/lib/access';
import { currentOwnerToken, setOwnerToken } from '@/lib/userData';

/** avisa o servidor, de tempos em tempos, que este aparelho continua na mesa */
/** vigia o acesso de teste: acabou o tempo, volta pra tela do código */
const TestExpiry = () => {
  const [left, setLeft] = useState(testAccessLeft());
  useEffect(() => {
    if (!left) return;
    const id = setInterval(() => {
      const s = testAccessLeft();
      setLeft(s);
      if (s <= 0) expireTestAccess();
    }, 1000);
    return () => clearInterval(id);
  }, [left]);
  if (!left) return null;
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 rounded-full border border-amber-500/50 bg-amber-500/15 backdrop-blur px-3 py-1 text-xs font-bold text-amber-400 tabular-nums">
      Acesso de teste · {fmt(left)}
    </div>
  );
};

const Heartbeat = () => {
  useEffect(() => {
    const ping = () => {
      supabase.functions.invoke('access-gate', { body: { action: 'heartbeat', device: deviceId() } }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, []);
  return null;
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

/** conta regressiva compartilhada */
const useCountdown = (until: number | null, onDone: () => void) => {
  const [left, setLeft] = useState(() => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!until) { setLeft(0); return; }
    const tick = () => {
      const s = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) onDone();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until, onDone]);
  return left;
};

export const AccessGate = ({ children }: { children: ReactNode }) => {
  const [granted, setGranted] = useState(() => localStorage.getItem(GRANT_KEY) === 'true');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [masterMode, setMasterMode] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);
  const [ticket, setTicket] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) ?? '');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lockUntil, setLockUntil] = useState<number | null>(() => {
    const v = Number(localStorage.getItem(LOCK_KEY) ?? 0);
    return v > Date.now() ? v : null;
  });

  const clearLock = () => { localStorage.removeItem(LOCK_KEY); setLockUntil(null); };
  const secondsLeft = useCountdown(lockUntil, clearLock);
  const locked = !!lockUntil && secondsLeft > 0;

  const applyLock = (ms: number) => {
    const until = Date.now() + ms;
    localStorage.setItem(LOCK_KEY, String(until));
    setLockUntil(until);
    setRemaining(null);
  };

  const call = callGate;

  const enterAsMaster = async (password: string, token?: string) => {
    await becomeMaster(password, token);
    window.location.hash = '#/mestre';
    setGranted(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const value = code.trim();
    if (!value) return;
    setLoading(true);
    try {
      const res = await call({ action: 'verify', code: value, device: deviceId(), oldToken: currentOwnerToken() });
      if (res?.ok) {
        localStorage.removeItem(LOCK_KEY);
        setLockUntil(null);
        setRemaining(null);
        if (res.master) {
          await enterAsMaster(value, res.token);
          return;
        }
        if (res.test) {
          grantTestAccess(Number(res.accessUntil), res.token);
          setGranted(true);
          return;
        }
        setTicket(res.ticket ?? '');
        setNeedEmail(true);
        return;
      }
      if (res?.locked && res.retryAfter) {
        applyLock(res.retryAfter * 1000);
        toast({
          title: 'Acesso bloqueado temporariamente',
          description: `Tente novamente em ${fmt(res.retryAfter)}.`,
          variant: 'destructive',
        });
        return;
      }
      setCode('');
      setRemaining(typeof res?.remaining === 'number' ? res.remaining : null);
      toast({
        title: 'Código inválido',
        description: typeof res?.remaining === 'number'
          ? `Restam ${res.remaining} tentativa(s) antes do bloqueio.`
          : 'Peça um novo código ao mestre.',
        variant: 'destructive',
      });
    } catch {
      toast({ title: 'Erro de conexão', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast({ title: 'E-mail inválido', description: 'Digite um e-mail válido para continuar.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await call({ action: 'register', device: deviceId(), email: value, ticket, oldToken: currentOwnerToken() });
      if (!res?.ok) {
        toast({ title: 'Não deu para registrar', description: res?.error ?? 'Confira o e-mail e tente de novo.', variant: 'destructive' });
        if (res?.error?.includes('código')) { setNeedEmail(false); setCode(''); }
        return;
      }
      setOwnerToken(res.token);
      localStorage.setItem(EMAIL_KEY, value);
      localStorage.setItem(GRANT_KEY, 'true');
      setGranted(true);
    } catch {
      toast({ title: 'Erro de conexão', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (granted) return <><Heartbeat /><TestExpiry />{children}</>;

  if (needEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 subtle-pattern">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl glow-border">
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-display font-bold gradient-text">Quase lá</h1>
                <p className="text-sm text-muted-foreground">Use sempre o mesmo e-mail: suas fichas e mapas aparecem em qualquer aparelho</p>
              </div>
              <form onSubmit={sendEmail} className="space-y-3">
                <Input
                  type="email"
                  autoFocus
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  maxLength={120}
                  className="text-center"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar na mesa'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 subtle-pattern">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl glow-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                {locked ? <Lock className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
              </div>
              <h1 className="text-3xl font-display font-bold gradient-text">Arcanum</h1>
              <p className="text-sm text-muted-foreground">
                {locked ? 'Muitas tentativas erradas' : 'Digite o código de acesso para entrar'}
              </p>
            </div>

            {locked && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center space-y-1">
                <p className="text-xs uppercase tracking-widest text-destructive flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Bloqueado
                </p>
                <p className="text-2xl font-display font-bold tabular-nums text-destructive">{fmt(secondsLeft)}</p>
                <p className="text-[11px] text-muted-foreground">Aguarde para tentar de novo.</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <Input
                type="password"
                inputMode="numeric"
                autoFocus
                disabled={locked || loading}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Código de acesso"
                maxLength={64}
                className="text-center tracking-[0.3em] text-lg"
              />
              <Button type="submit" className="w-full" disabled={loading || locked}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : locked ? `Aguarde ${fmt(secondsLeft)}` : 'Entrar'}
              </Button>
            </form>

            {!locked && remaining !== null && (
              <p className="text-center text-xs text-destructive">
                {remaining === 0 ? 'Próximo erro bloqueia o acesso.' : `Restam ${remaining} tentativa(s)`}
              </p>
            )}

            <button
              type="button"
              onClick={() => setMasterMode(v => !v)}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" /> Área do Mestre
            </button>

            {masterMode && <MasterLogin locked={locked} onLock={applyLock} onEnter={enterAsMaster} />}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};


const MasterLogin = ({ locked, onLock, onEnter }: {
  locked: boolean; onLock: (ms: number) => void; onEnter: (password: string, token?: string) => Promise<void>;
}) => {
  const [master, setMaster] = useState('');
  const [loading, setLoading] = useState(false);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = master.trim();
    if (!value) return;
    setLoading(true);
    try {
      const res = await callGate({ action: 'master-status', master: value, oldToken: currentOwnerToken() });
      if (res?.ok) { await onEnter(value, res.token); return; }
      if (res?.locked && res.retryAfter) {
        onLock(res.retryAfter * 1000);
        toast({ title: 'Bloqueado por tentativas demais', variant: 'destructive' });
      } else {
        toast({
          title: 'Senha de mestre incorreta',
          description: typeof res?.remaining === 'number' ? `Restam ${res.remaining} tentativa(s).` : undefined,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={unlock} className="pt-4 border-t border-border/40 space-y-3">
      <Input type="password" value={master} disabled={locked} onChange={e => setMaster(e.target.value)} placeholder="Senha de mestre" maxLength={64} />
      <Button type="submit" variant="secondary" className="w-full" disabled={loading || locked || !master.trim()}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar como mestre'}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">O site abre normalmente, com uma aba extra "Mestre" para gerar códigos e ver quem entrou.</p>
    </form>
  );
};
