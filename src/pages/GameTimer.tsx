import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw, Sun, Moon, Sunrise, Sunset, FastForward, Plus, Trash2 } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

interface ExtraTimer extends TimerState {
  id: string;
  name: string;
}

const getTimeOfDay = (hours: number) => {
  if (hours >= 6 && hours < 12) return { label: 'Manhã', icon: Sunrise, emoji: '🌅', color: 'text-amber-400' };
  if (hours >= 12 && hours < 18) return { label: 'Tarde', icon: Sun, emoji: '☀️', color: 'text-yellow-400' };
  if (hours >= 18 && hours < 21) return { label: 'Anoitecer', icon: Sunset, emoji: '🌇', color: 'text-orange-400' };
  return { label: 'Noite Profunda', icon: Moon, emoji: '🌙', color: 'text-blue-400' };
};

interface TimerCardProps {
  timer: TimerState;
  setTimer: (updater: (prev: TimerState) => TimerState) => void;
  title: string;
  onRename?: (name: string) => void;
  onRemove?: () => void;
  isMain?: boolean;
}

const TimerCard = ({ timer, setTimer, title, onRename, onRemove, isMain }: TimerCardProps) => {
  // Recover elapsed time while page was closed
  useEffect(() => {
    if (timer.isRunning && timer.lastTickTimestamp > 0) {
      const realMsElapsed = Date.now() - timer.lastTickTimestamp;
      const realMinutesElapsed = realMsElapsed / 60000;
      const gameMinutesGained = (realMinutesElapsed / timer.realMinutesPerGameHour) * 60;
      if (gameMinutesGained > 0.01) {
        setTimer(prev => ({
          ...prev,
          gameMinutesElapsed: prev.gameMinutesElapsed + gameMinutesGained,
          lastTickTimestamp: Date.now(),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ticker
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(() => {
      const gameMinutesPerRealSecond = 60 / (timer.realMinutesPerGameHour * 60);
      setTimer(prev => ({
        ...prev,
        gameMinutesElapsed: prev.gameMinutesElapsed + gameMinutesPerRealSecond,
        lastTickTimestamp: Date.now(),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.realMinutesPerGameHour, setTimer]);

  const totalMinutes = Math.floor(timer.gameMinutesElapsed);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const timeOfDay = getTimeOfDay(hours);
  const TimeIcon = timeOfDay.icon;
  const dayProgress = ((totalMinutes % 1440) / 1440) * 100;

  const toggle = () => setTimer(prev => ({ ...prev, isRunning: !prev.isRunning, lastTickTimestamp: Date.now() }));
  const reset = () => setTimer(prev => ({ ...prev, isRunning: false, gameMinutesElapsed: 0, lastTickTimestamp: 0 }));
  const skip = (m: number) => setTimer(prev => ({ ...prev, gameMinutesElapsed: prev.gameMinutesElapsed + m, lastTickTimestamp: Date.now() }));

  return (
    <Card className={isMain ? 'card-hover glow-border' : 'card-hover'}>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          {onRename ? (
            <Input
              value={title}
              onChange={e => onRename(e.target.value)}
              className="h-8 font-display font-semibold text-base"
              placeholder="Nome do timer"
            />
          ) : (
            <h3 className="font-display font-semibold text-base flex-1">{title}</h3>
          )}
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Minutos reais = 1 hora no jogo
          </label>
          <NumberInput
            min={1}
            value={timer.realMinutesPerGameHour}
            onChange={v => setTimer(prev => ({ ...prev, realMinutesPerGameHour: Math.max(1, v) }))}
          />
        </div>

        <div className="text-center py-4">
          <motion.div
            key={timeOfDay.label}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <TimeIcon className={`w-10 h-10 mx-auto mb-2 ${timeOfDay.color} ${timer.isRunning ? 'animate-pulse' : ''}`} />
          </motion.div>
          <p className="text-xs font-semibold text-primary mb-1">{timeOfDay.emoji} {timeOfDay.label}</p>
          <div className="text-4xl md:text-5xl font-display font-bold text-primary dice-glow">
            {days > 0 && <span className="text-2xl text-muted-foreground">{days}d </span>}
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
          </div>

          <div className="mt-3 mx-auto max-w-xs">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 via-50% to-blue-500"
                animate={{ width: `${dayProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '15min', mins: 15 },
            { label: '1h', mins: 60 },
            { label: '6h', mins: 360 },
            { label: '1 dia', mins: 1440 },
          ].map(s => (
            <Button key={s.label} variant="outline" size="sm" onClick={() => skip(s.mins)} className="gap-1">
              <FastForward className="w-3 h-3" />{s.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={toggle} className="flex-1 gap-2">
            {timer.isRunning ? <><Pause className="w-4 h-4" />Pausar</> : <><Play className="w-4 h-4" />Iniciar</>}
          </Button>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const GameTimer = () => {
  const [timer, setTimer] = useLocalStorage<TimerState>('arcanum-timer', {
    realMinutesPerGameHour: 1,
    isRunning: false,
    gameMinutesElapsed: 0,
    lastTickTimestamp: 0,
  });

  const [extras, setExtras] = useLocalStorage<ExtraTimer[]>('arcanum-extra-timers', []);

  const addTimer = () => {
    setExtras(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Timer ${prev.length + 2}`,
        realMinutesPerGameHour: 1,
        isRunning: false,
        gameMinutesElapsed: 0,
        lastTickTimestamp: 0,
      },
    ]);
  };

  const updateExtra = (id: string, updater: (prev: TimerState) => TimerState) => {
    setExtras(prev => prev.map(t => (t.id === id ? { ...t, ...updater(t) } : t)));
  };

  const renameExtra = (id: string, name: string) => {
    setExtras(prev => prev.map(t => (t.id === id ? { ...t, name } : t)));
  };

  const removeExtra = (id: string) => {
    setExtras(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
          Timers do Jogo
        </motion.h1>
        <Button onClick={addTimer} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Timer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TimerCard
            timer={timer}
            setTimer={setTimer}
            title="Timer Principal"
            isMain
          />
        </motion.div>

        <AnimatePresence>
          {extras.map(extra => (
            <motion.div
              key={extra.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <TimerCard
                timer={extra}
                setTimer={updater => updateExtra(extra.id, updater)}
                title={extra.name}
                onRename={name => renameExtra(extra.id, name)}
                onRemove={() => removeExtra(extra.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {extras.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Clique em <span className="text-primary font-semibold">"Novo Timer"</span> para adicionar quantos timers desejar (cronômetro paralelo, viagem, ritual, etc.)
        </p>
      )}
    </div>
  );
};

export default GameTimer;
