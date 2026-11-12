import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Swords, Clock, Dices, Users, Skull, StickyNote, Sparkles,
  UserPlus, ChevronRight, Heart, Shield, Sun, Moon, Sunrise, Sunset,
  Coins, ArrowUpRight, Radio, BookOpen, Map as MapIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerState { realMinutesPerGameHour: number; isRunning: boolean; gameMinutesElapsed: number; lastTickTimestamp: number; }
interface Combatant { id: string; name: string; initiative: number; hp?: number; maxHp?: number; ca?: number; conditions?: string[]; type: 'player' | 'monster'; }
interface Note { id: string; title: string; content: string; createdAt: string; pinned?: boolean; color?: string; }

const getTimeOfDay = (hours: number) => {
  if (hours >= 5 && hours < 8) return { label: 'Amanhecer', icon: Sunrise, emoji: '🌅' };
  if (hours >= 8 && hours < 17) return { label: 'Dia', icon: Sun, emoji: '☀️' };
  if (hours >= 17 && hours < 20) return { label: 'Entardecer', icon: Sunset, emoji: '🌇' };
  return { label: 'Noite', icon: Moon, emoji: '🌙' };
};

const quickLinks = [
  { path: '/dados', label: 'Dados', caption: 'Rolar agora', icon: Dices, color: 'text-sky-300', glow: 'from-sky-500/20' },
  { path: '/iniciativa', label: 'Iniciativa', caption: 'Ordem de combate', icon: Swords, color: 'text-violet-300', glow: 'from-violet-500/20' },
  { path: '/npc', label: 'NPC', caption: 'Criar personagem', icon: UserPlus, color: 'text-emerald-300', glow: 'from-emerald-500/20' },
  { path: '/loot', label: 'Loot', caption: 'Tesouro rápido', icon: Coins, color: 'text-amber-300', glow: 'from-amber-500/20' },
  { path: '/magias', label: 'Magias', caption: 'Compêndio', icon: Sparkles, color: 'text-fuchsia-300', glow: 'from-fuchsia-500/20' },
  { path: '/monstros', label: 'Monstros', caption: 'Ameaças', icon: Skull, color: 'text-rose-300', glow: 'from-rose-500/20' },
];

const Dashboard = () => {
  const [timer] = useLocalStorage<TimerState>('arcanum-timer', { realMinutesPerGameHour: 1, isRunning: false, gameMinutesElapsed: 0, lastTickTimestamp: 0 });
  const [combatants] = useLocalStorage<Combatant[]>('arcanum-initiative', []);
  const [currentTurn] = useLocalStorage<number>('arcanum-initiative-turn', 0);
  const [round] = useLocalStorage<number>('arcanum-initiative-round', 1);
  const [notes] = useLocalStorage<Note[]>('arcanum-notes', []);
  const totalMinutes = Math.floor(timer.gameMinutesElapsed);
  const days = Math.floor(totalMinutes / 1440) + 1;
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const tod = getTimeOfDay(hours);
  const TodIcon = tod.icon;
  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
  const activeCombatant = sorted.length ? sorted[currentTurn % sorted.length] : null;
  const nextCombatant = sorted.length > 1 ? sorted[(currentTurn + 1) % sorted.length] : null;
  const pinnedNotes = notes.filter(n => n.pinned).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1380px] space-y-5 md:space-y-6">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-primary/80">Arcanum · Central de comando</p>
          <h1 className="page-title">Painel do Mestre</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tudo que importa para conduzir a sessão, sem ruído.</p>
        </div>
        <Link to="/mesa?t=iniciativa" className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-semibold text-primary transition hover:bg-primary/20">
          <Swords className="h-4 w-4" /> Abrir combate <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </motion.header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} className="relative min-h-[220px] overflow-hidden rounded-[1.65rem] border border-white/10 bg-gradient-to-br from-primary/20 via-card/55 to-card/25 p-6 shadow-[0_24px_70px_-35px_hsl(var(--primary)/0.7)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-28 w-56 rounded-full bg-[hsl(var(--ember)/.18)] blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-foreground/60">Estado da mesa</p>
                <h2 className="mt-2 max-w-xl text-3xl font-display font-bold leading-tight md:text-4xl">A próxima cena começa aqui.</h2>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Online</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Radio className="h-4 w-4 text-primary" /> {activeCombatant ? `Round ${round} · ${activeCombatant.name} joga agora` : 'Nenhum combate ativo'}</div>
              <Link to="/tabletop" className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background transition hover:bg-primary hover:text-primary-foreground">Abrir mesa <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="glass-card flex min-h-[220px] flex-col justify-between rounded-[1.65rem] p-6">
          <div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">Tempo da campanha</p><p className="mt-2 text-4xl font-display font-bold tracking-tight">{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</p></div><TodIcon className="h-8 w-8 text-primary/80" /></div>
          <div className="flex items-end justify-between"><div><p className="text-sm font-semibold">Dia {days}</p><p className="text-xs text-muted-foreground">{tod.emoji} {tod.label}</p></div><Badge variant={timer.isRunning ? 'default' : 'secondary'} className="rounded-full text-[10px]">{timer.isRunning ? 'Rodando' : 'Pausado'}</Badge></div>
        </motion.div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickLinks.map((item, index) => <Link key={item.path} to={item.path}><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${item.glow} to-card/40 p-4 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_35px_-20px_hsl(var(--primary)/.8)]`}><div className="relative"><item.icon className={`h-5 w-5 ${item.color} transition-transform group-hover:scale-110`} /><p className="mt-4 text-sm font-semibold">{item.label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.caption}</p></div></motion.div></Link>)}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[1.65rem] p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Ao vivo</p><h2 className="mt-1 text-xl font-display font-bold">Ordem de iniciativa</h2></div><Link to="/mesa?t=iniciativa" className="text-xs font-semibold text-primary hover:underline">Gerenciar</Link></div>
          {sorted.length === 0 ? <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/20 text-center"><div><Swords className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">Nenhum combate ativo</p><Link to="/mesa?t=iniciativa" className="mt-2 inline-block text-xs font-semibold text-primary">Adicionar combatentes</Link></div></div> : <div className="grid gap-2 sm:grid-cols-2">{sorted.slice(0, 6).map((combatant, index) => { const active = index === currentTurn % sorted.length; return <div key={combatant.id} className={`flex items-center justify-between rounded-2xl border p-3 ${active ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-background/20'}`}><div className="flex min-w-0 items-center gap-3">{active ? <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />}<div className="min-w-0"><p className={`truncate text-sm font-semibold ${active ? 'text-primary' : ''}`}>{combatant.name}</p><p className="text-[10px] text-muted-foreground">{combatant.type === 'monster' ? 'Ameaça' : 'Jogador'}{combatant.ca ? ` · DEF ${combatant.ca}` : ''}</p></div></div><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{combatant.hp != null ? <><Heart className="mr-1 inline h-3 w-3" />{combatant.hp}/{combatant.maxHp}</> : '—'}</span><span className="font-display text-lg font-bold text-primary">{combatant.initiative}</span></div></div>})}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-[1.65rem] p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Memória da mesa</p><h2 className="mt-1 text-xl font-display font-bold">Notas fixadas</h2></div><Link to="/notas" className="rounded-xl border border-white/10 p-2 text-muted-foreground hover:text-primary"><StickyNote className="h-4 w-4" /></Link></div>{pinnedNotes.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center text-center"><BookOpen className="mb-3 h-7 w-7 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">Nenhuma nota fixada ainda.</p><Link to="/notas" className="mt-2 text-xs font-semibold text-primary">Criar uma nota</Link></div> : <div className="space-y-2">{pinnedNotes.map(note => <Link to="/notas" key={note.id} className="block rounded-2xl border border-white/5 bg-background/20 p-3 transition hover:border-primary/30"><p className="truncate text-sm font-semibold">{note.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.content}</p></Link>)}</div>}</motion.div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
        { label: 'Combatentes', value: combatants.length, icon: Users, path: '/iniciativa' },
        { label: 'Notas', value: notes.length, icon: StickyNote, path: '/notas' },
        { label: 'Dia atual', value: days, icon: Sun, path: '/timer' },
        { label: 'Mapas ativos', value: 1, icon: MapIcon, path: '/tabletop' },
      ].map(stat => <Link key={stat.label} to={stat.path} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-card/30 p-4 transition hover:border-primary/30"><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><stat.icon className="h-4 w-4" /></span><span><strong className="block text-2xl font-display group-hover:text-primary">{stat.value}</strong><small className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</small></span></Link>)}
      </section>
    </div>
  );
};

export default Dashboard;
