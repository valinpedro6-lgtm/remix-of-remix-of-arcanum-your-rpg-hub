import { ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { KeyRound, Shield, Loader2, Copy, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const GRANT_KEY = 'arcanum-access-granted';
const MASTER_KEY = 'arcanum-master-key';
const LOCK_KEY = 'arcanum-access-lock';

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

  const call = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('access-gate', { body: payload });
    if (error) throw error;
    return data as any;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const value = code.trim();
    if (!value) return;
    setLoading(true);
    try {
      const res = await call({ action: 'verify', code: value });
      if (res?.ok) {
        localStorage.removeItem(LOCK_KEY);
        setLockUntil(null);
        setRemaining(null);
        localStorage.setItem(GRANT_KEY, 'true');
        if (res.master) localStorage.setItem(MASTER_KEY, value);
        setGranted(true);
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

  if (granted) return <>{children}</>;

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

            {masterMode && <MasterPanel locked={locked} onLock={applyLock} />}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};


const MasterPanel = ({ locked, onLock }: { locked: boolean; onLock: (ms: number) => void }) => {
  const [master, setMaster] = useState(() => localStorage.getItem(MASTER_KEY) ?? '');
  const [unlocked, setUnlocked] = useState(false);
  const [current, setCurrent] = useState('');
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const call = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('access-gate', { body: payload });
    if (error) throw error;
    return data as any;
  };

  const unlock = async () => {
    setLoading(true);
    try {
      const res = await call({ action: 'master-status', master: master.trim() });
      if (res?.ok) {
        localStorage.setItem(MASTER_KEY, master.trim());
        setCurrent(res.currentCode);
        setUnlocked(true);
      } else if (res?.locked && res.retryAfter) {
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

  const rotate = async (value?: string) => {
    setLoading(true);
    try {
      const res = await call({ action: 'set-code', master: master.trim(), code: value ?? '' });
      if (res?.ok) {
        setCurrent(res.currentCode);
        setCustom('');
        toast({ title: 'Novo código gerado', description: 'O código anterior não vale mais.' });
      }
    } catch {
      toast({ title: 'Erro ao gerar código', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-border/40 space-y-3">
      {!unlocked ? (
        <>
          <Input
            type="password"
            value={master}
            disabled={locked}
            onChange={e => setMaster(e.target.value)}
            placeholder="Senha de mestre"
            maxLength={64}
          />
          <Button variant="secondary" className="w-full" onClick={unlock} disabled={loading || locked || !master.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Acessar painel'}
          </Button>

        </>
      ) : (
        <>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Código atual</p>
            <p className="text-2xl font-display font-bold tracking-[0.25em] text-primary">{current}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard?.writeText(current); toast({ title: 'Código copiado' }); }}>
              <Copy className="w-4 h-4 mr-1" /> Copiar
            </Button>
            <Button className="flex-1" onClick={() => rotate()} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Gerar novo
            </Button>
          </div>
          <div className="flex gap-2">
            <Input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Código personalizado" maxLength={32} />
            <Button variant="secondary" onClick={() => custom.trim() && rotate(custom.trim())} disabled={loading || !custom.trim()}>
              Definir
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Cada novo código invalida o anterior. Quem já entrou continua com acesso neste aparelho.
          </p>
        </>
      )}
    </div>
  );
};
