import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Swords, Clock, Dices, Users, Skull, StickyNote, FlaskConical,
  Sparkles, Sword, CloudSun, UserPlus, Gamepad2, ChevronRight,
  Heart, Shield, Sun, Moon, Sunrise, Sunset, Coins
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp?: number;
  maxHp?: number;
  ca?: number;
  conditions?: string[];
  type: 'player' | 'monster';
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  pinned?: boolean;
  color?: string;
}

const getTimeOfDay = (hours: number) => {
  if (hours >= 5 && hours < 8) return { label: 'Amanhecer', icon: Sunrise, emoji: '🌅' };
  if (hours >= 8 && hours < 17) return { label: 'Dia', icon: Sun, emoji: '☀️' };
  if (hours >= 17 && hours < 20) return { label: 'Entardecer', icon: Sunset, emoji: '🌇' };
  return { label: 'Noite', icon: Moon, emoji: '🌙' };
};

const Dashboard = () => {
  const [timer] = useLocalStorage<TimerState>('arcanum-timer', {
    realMinutesPerGameHour: 1,
    isRunning: false,
    gameMinutesElapsed: 0,
    lastTickTimestamp: 0,
  });
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
  const activeCombatant = sorted.length > 0 ? sorted[currentTurn % sorted.length] : null;

  const recentNotes = notes.filter(n => n.pinned).slice(0, 3);
  const hasNotes = recentNotes.length > 0;

  const quickLinks = [
    { path: '/dados', label: 'Dados', icon: Dices, color: 'text-red-400' },
    { path: '/iniciativa', label: 'Iniciativa', icon: Swords, color: 'text-amber-400' },
    { path: '/npc', label: 'NPC', icon: UserPlus, color: 'text-teal-400' },
    { path: '/loot', label: 'Loot', icon: Coins, color: 'text-yellow-400' },
    { path: '/magias', label: 'Magias', icon: Sparkles, color: 'text-indigo-400' },
    { path: '/monstros', label: 'Monstros', icon: Skull, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
        Painel do Mestre
      </motion.h1>

      {/* Quick Access */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {quickLinks.map((l, i) => (
          <Link key={l.path} to={l.path}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/60 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
            >
              <l.icon className={`w-5 h-5 ${l.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">{l.label}</span>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Timer Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link to="/mesa?t=timer">
            <Card className="card-hover glow-border h-full group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">Timer do Jogo</h3>
                  </div>
                  <Badge variant={timer.isRunning ? 'default' : 'secondary'} className="text-[10px]">
                    {timer.isRunning ? '▶ Rodando' : '⏸ Pausado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <TodIcon className="w-8 h-8 text-primary/70" />
                  <div>
                    <p className="text-2xl font-display font-bold text-primary">
                      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                    </p>
                    <p className="text-xs text-muted-foreground">Dia {days} — {tod.emoji} {tod.label}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span>Gerenciar timer</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Initiative Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link to="/mesa?t=iniciativa">
            <Card className="card-hover h-full group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">Combate</h3>
                  </div>
                  {sorted.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">Round {round}</Badge>
                  )}
                </div>
                {sorted.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Nenhum combate ativo</p>
                ) : (
                  <div className="space-y-2">
                    {sorted.slice(0, 4).map((c, i) => {
                      const isActive = i === currentTurn % sorted.length;
                      return (
                        <div key={c.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${isActive ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30'}`}>
                          <div className="flex items-center gap-2">
                            {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                            {c.type === 'monster' ? <Skull className="w-3.5 h-3.5 text-destructive" /> : <Users className="w-3.5 h-3.5 text-primary" />}
                            <span className={`font-semibold ${isActive ? 'text-primary' : ''}`}>{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.maxHp && c.maxHp > 0 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Heart className="w-3 h-3" />{c.hp}/{c.maxHp}
                              </span>
                            )}
                            <span className="font-display font-bold text-primary">{c.initiative}</span>
                          </div>
                        </div>
                      );
                    })}
                    {sorted.length > 4 && (
                      <p className="text-[10px] text-muted-foreground text-center">+{sorted.length - 4} combatentes</p>
                    )}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span>Gerenciar combate</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Notes Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Link to="/notas">
            <Card className="card-hover h-full group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">Notas Fixadas</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{notes.length} notas</Badge>
                </div>
                {!hasNotes ? (
                  <p className="text-sm text-muted-foreground py-4">Nenhuma nota fixada</p>
                ) : (
                  <div className="space-y-2">
                    {recentNotes.map(n => (
                      <div key={n.id} className="p-2 rounded-lg bg-secondary/30 border border-border/20">
                        <p className="text-sm font-semibold truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span>Ver todas as notas</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Combatentes', value: combatants.length, icon: Swords, path: '/iniciativa' },
            { label: 'Notas', value: notes.length, icon: StickyNote, path: '/notas' },
            { label: 'Dia Atual', value: days, icon: Sun, path: '/timer' },
            { label: 'Round', value: sorted.length > 0 ? round : '-', icon: Shield, path: '/iniciativa' },
          ].map((s, i) => (
            <Link key={s.label} to={s.path}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-primary">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
