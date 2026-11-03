import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getActiveSystemId, getLiveSystem } from '@/lib/systemMode';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BookOpen, Check, CircleDot, Clock3, Eye, Flag, Gauge,
  HeartPulse, Lightbulb, MapPin, Plus, Save, ScrollText, Sparkles, Swords, Target, Trash2, Users
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SessionClock { id: string; name: string; value: number; max: number; }
interface SessionDirectorState {
  title: string; tone: string; scene: string; objective: string; notes: string;
  clues: string[]; npcs: string[]; threats: string[]; consequences: string[]; clocks: SessionClock[];
  startedAt: string;
}

const initialState: SessionDirectorState = {
  title: 'Sessão sem título', tone: 'Investigação', scene: 'Cena de abertura', objective: 'Descobrir o que está acontecendo', notes: '',
  clues: [], npcs: [], threats: [], consequences: [], clocks: [], startedAt: new Date().toISOString(),
};

const SessionDirector = () => {
  const [systemId, setSystemId] = useState(getActiveSystemId());
  const [session, setSession] = useLocalStorage<SessionDirectorState>('arcanum-session-director', initialState);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const system = getLiveSystem(systemId);

  useEffect(() => {
    const handler = () => setSystemId(getActiveSystemId());
    window.addEventListener('arcanum-system-change', handler);
    return () => window.removeEventListener('arcanum-system-change', handler);
  }, []);

  const addItem = (field: 'clues' | 'npcs' | 'threats' | 'consequences', placeholder: string) => {
    const value = (draft[field] || '').trim();
    if (!value) return;
    setSession(prev => ({ ...prev, [field]: [...prev[field], value] }));
    setDraft(prev => ({ ...prev, [field]: '' }));
  };
  const removeItem = (field: 'clues' | 'npcs' | 'threats' | 'consequences', index: number) => {
    setSession(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };
  const addClock = () => setSession(prev => ({ ...prev, clocks: [...prev.clocks, { id: crypto.randomUUID(), name: 'Novo relógio de perigo', value: 0, max: 6 }] }));
  const updateClock = (id: string, patch: Partial<SessionClock>) => setSession(prev => ({ ...prev, clocks: prev.clocks.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const newScene = () => setSession(prev => ({ ...prev, scene: 'Nova cena', objective: 'Defina o próximo objetivo', notes: '' }));
  const quickAction = (type: 'threat' | 'clue' | 'reward') => {
    const labels = { threat: 'Ameaça gerada — detalhe durante a cena', clue: 'Pista gerada — conecte-a ao mistério', reward: 'Recompensa gerada — defina valor e consequência' };
    const field = type === 'threat' ? 'threats' : type === 'clue' ? 'clues' : 'consequences';
    setSession(prev => ({ ...prev, [field]: [...prev[field], labels[type]] }));
  };
  const summary = `${session.title}\n${session.scene} — ${session.objective}\n\nPistas: ${session.clues.join('; ') || 'nenhuma'}\nNPCs: ${session.npcs.join('; ') || 'nenhum'}\nAmeaças: ${session.threats.join('; ') || 'nenhuma'}\nConsequências: ${session.consequences.join('; ') || 'nenhuma'}\n\nNotas: ${session.notes || 'nenhuma'}`;

  const fieldCard = (title: string, field: 'clues' | 'npcs' | 'threats' | 'consequences', icon: React.ReactNode, color: string, placeholder: string) => (
    <Card className="border-border/40 bg-card/70">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-display"><span className={color}>{icon}</span>{title}<Badge variant="secondary" className="ml-auto text-[10px]">{session[field].length}</Badge></CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {session[field].map((item, i) => <div key={`${item}-${i}`} className="flex items-start gap-2 rounded-lg border border-border/30 bg-secondary/20 p-2 text-sm"><span className="flex-1">{item}</span><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(field, i)}><Trash2 className="h-3 w-3" /></Button></div>)}
        <div className="flex gap-2"><Input value={draft[field] || ''} onChange={e => setDraft(prev => ({ ...prev, [field]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addItem(field, placeholder)} placeholder={placeholder} className="h-9 text-xs" /><Button size="icon" className="h-9 w-9 shrink-0" onClick={() => addItem(field, placeholder)}><Plus className="h-4 w-4" /></Button></div>
      </CardContent>
    </Card>
  );

  return <div className="space-y-6" style={{ '--system-accent': system.accent } as React.CSSProperties}>
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="section-kicker mb-2">Centro de controle da campanha</p><h1 className="page-title">Diretor de Sessão Vivo</h1><div className="rune-divider mt-3 w-56" /><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Acompanhe a cena, a tensão e as consequências sem sair do fluxo da mesa.</p></div>
      <div className="flex items-center gap-2"><Badge variant="outline" className="gap-2 border-primary/30"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" />{system.name}</Badge><Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(summary)}><Save className="h-4 w-4" />Copiar resumo</Button></div>
    </motion.div>

    <Card className="overflow-hidden border-primary/30 bg-card/75 shadow-[0_0_40px_-22px_var(--system-accent)]"><CardContent className="p-5 md:p-6"><div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
      <div><label className="text-[10px] uppercase tracking-widest text-muted-foreground">Campanha</label><Input value={session.title} onChange={e => setSession(prev => ({ ...prev, title: e.target.value }))} className="mt-1 border-0 bg-transparent px-0 text-xl font-display font-bold focus-visible:ring-0" /></div>
      <div><label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tom da sessão</label><select value={session.tone} onChange={e => setSession(prev => ({ ...prev, tone: e.target.value }))} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Investigação</option><option>Terror</option><option>Épico</option><option>Ação</option><option>Intriga</option><option>Sobrevivência</option></select></div>
      <div><label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sistema ativo</label><p className="mt-1 flex h-10 items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 text-sm font-semibold" style={{ color: system.accent }}>{system.short} · {system.dice}</p></div>
    </div></CardContent></Card>

    <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
      <Card className="border-primary/25 bg-card/75"><CardHeader><CardTitle className="flex items-center gap-2 font-display"><MapPin className="h-5 w-5 text-primary" />Cena atual <Badge variant="outline" className="ml-auto text-[10px]">{system.lens}</Badge></CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-xs font-semibold text-muted-foreground">Local / momento</label><Input value={session.scene} onChange={e => setSession(prev => ({ ...prev, scene: e.target.value }))} className="mt-1" /></div><div><label className="text-xs font-semibold text-muted-foreground">Objetivo da cena</label><Input value={session.objective} onChange={e => setSession(prev => ({ ...prev, objective: e.target.value }))} className="mt-1" /></div><div><label className="text-xs font-semibold text-muted-foreground">Notas privadas do Mestre</label><textarea value={session.notes} onChange={e => setSession(prev => ({ ...prev, notes: e.target.value }))} className="mt-1 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="O que você não pode esquecer nesta cena?" /></div><Button onClick={newScene} variant="outline"><ArrowRight className="h-4 w-4" />Abrir nova cena</Button></CardContent></Card>
      <Card className="border-primary/25 bg-card/75"><CardHeader><CardTitle className="flex items-center gap-2 font-display"><Gauge className="h-5 w-5 text-primary" />Ações do diretor</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1"><Button variant="secondary" className="justify-start" onClick={() => quickAction('clue')}><Lightbulb className="h-4 w-4 text-yellow-400" />Adicionar pista</Button><Button variant="secondary" className="justify-start" onClick={() => quickAction('threat')}><AlertTriangle className="h-4 w-4 text-red-400" />Gerar ameaça</Button><Button variant="secondary" className="justify-start" onClick={() => quickAction('reward')}><Sparkles className="h-4 w-4 text-amber-400" />Gerar recompensa</Button><Button variant="secondary" className="justify-start" onClick={() => navigator.clipboard?.writeText(summary)}><ScrollText className="h-4 w-4 text-primary" />Copiar resumo da sessão</Button><Button asChild variant="outline" className="justify-start"><Link to="/mesa?t=iniciativa"><Swords className="h-4 w-4" />Abrir combate</Link></Button></CardContent></Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2">{fieldCard('Pistas e revelações', 'clues', <Lightbulb className="h-4 w-4" />, 'text-yellow-400', 'Nova pista...')}{fieldCard('NPCs em cena', 'npcs', <Users className="h-4 w-4" />, 'text-teal-400', 'Nome e papel do NPC...')}{fieldCard('Ameaças ativas', 'threats', <AlertTriangle className="h-4 w-4" />, 'text-red-400', 'Ameaça ou inimigo...')}{fieldCard('Consequências e recompensas', 'consequences', <Flag className="h-4 w-4" />, 'text-amber-400', 'Consequência, recompensa ou gancho...')}</div>

    <Card className="border-border/40 bg-card/70"><CardHeader><CardTitle className="flex items-center gap-2 font-display"><Clock3 className="h-5 w-5 text-primary" />Relógios de perigo <Button size="sm" variant="outline" className="ml-auto" onClick={addClock}><Plus className="h-4 w-4" />Novo relógio</Button></CardTitle></CardHeader><CardContent>{session.clocks.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Use relógios para controlar tensão, perseguições, rituais, Heat ou qualquer ameaça que avança.</p> : <div className="grid gap-3 md:grid-cols-2">{session.clocks.map(clock => <div key={clock.id} className="rounded-lg border border-border/30 bg-secondary/20 p-3"><div className="flex gap-2"><Input value={clock.name} onChange={e => updateClock(clock.id, { name: e.target.value })} className="h-8 text-sm" /><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSession(prev => ({ ...prev, clocks: prev.clocks.filter(c => c.id !== clock.id) }))}><Trash2 className="h-3 w-3" /></Button></div><div className="mt-3 flex items-center gap-2"><input type="range" min="0" max={clock.max} value={clock.value} onChange={e => updateClock(clock.id, { value: Number(e.target.value) })} className="w-full accent-primary" /><span className="text-xs font-bold text-primary">{clock.value}/{clock.max}</span></div></div>)}</div>}</CardContent></Card>

    <Card className="border-primary/20 bg-primary/5"><CardContent className="flex flex-wrap items-center gap-3 p-4"><Check className="h-5 w-5 text-primary" /><div className="flex-1"><p className="font-semibold">Resumo pronto para a próxima sessão</p><p className="text-xs text-muted-foreground">O Diretor salva tudo automaticamente neste aparelho. {session.clues.length + session.npcs.length + session.threats.length} elementos registrados nesta cena.</p></div><Badge variant="outline" className="gap-1"><HeartPulse className="h-3 w-3" />{system.health}: ativo</Badge><Badge variant="outline" className="gap-1"><Target className="h-3 w-3" />{system.mainResource}</Badge></CardContent></Card>
  </div>;
};

export default SessionDirector;
