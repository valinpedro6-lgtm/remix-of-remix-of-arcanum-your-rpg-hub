import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Sun, Moon, Sunrise, Sunset, FastForward } from 'lucide-react';
import { NumberInput } from '@/components/NumberInput';
import { motion } from 'framer-motion';

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

const getTimeOfDay = (hours: number) => {
  if (hours >= 6 && hours < 12) return { label: 'Manhã', icon: Sunrise, emoji: '🌅', color: 'text-amber-400' };
  if (hours >= 12 && hours < 18) return { label: 'Tarde', icon: Sun, emoji: '☀️', color: 'text-yellow-400' };
  if (hours >= 18 && hours < 21) return { label: 'Anoitecer', icon: Sunset, emoji: '🌇', color: 'text-orange-400' };
  return { label: 'Noite Profunda', icon: Moon, emoji: '🌙', color: 'text-blue-400' };
};

const GameTimer = () => {
  // Read-only: the GlobalTimerBar in Layout handles the ticking interval
  const [timer, setTimer] = useLocalStorage<TimerState>('arcanum-timer', {
    realMinutesPerGameHour: 1,
    isRunning: false,
    gameMinutesElapsed: 0,
    lastTickTimestamp: 0,
  });

  // Force re-render every second to show updated time from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      // Read latest from localStorage directly to stay in sync
      try {
        const raw = localStorage.getItem('arcanum-timer');
        if (raw) {
          const parsed = JSON.parse(raw);
          setTimer(parsed);
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [setTimer]);

  const totalMinutes = Math.floor(timer.gameMinutesElapsed);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const timeOfDay = getTimeOfDay(hours);
  const TimeIcon = timeOfDay.icon;
  const dayProgress = ((totalMinutes % 1440) / 1440) * 100;

  const toggle = () => setTimer(prev => ({ ...prev, isRunning: !prev.isRunning, lastTickTimestamp: Date.now() }));
  const reset = () => setTimer(prev => ({ ...prev, isRunning: false, gameMinutesElapsed: 0, lastTickTimestamp: 0 }));
  const skip = (gameMinutes: number) => setTimer(prev => ({ ...prev, gameMinutesElapsed: prev.gameMinutesElapsed + gameMinutes, lastTickTimestamp: Date.now() }));

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
        Timer do Jogo
      </motion.h1>
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="card-hover glow-border">
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Minutos reais = 1 hora no jogo
                </label>
                <NumberInput
                  min={1}
                  value={timer.realMinutesPerGameHour}
                  onChange={v => setTimer(prev => ({ ...prev, realMinutesPerGameHour: Math.max(1, v) }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {timer.realMinutesPerGameHour} min real = 1h no jogo
                </p>
              </div>

              <div className="text-center py-8">
                <motion.div
                  key={timeOfDay.label}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <TimeIcon className={`w-14 h-14 mx-auto mb-3 ${timeOfDay.color} ${timer.isRunning ? 'animate-pulse' : ''}`} />
                </motion.div>
                <p className="text-sm font-semibold text-primary mb-2">{timeOfDay.emoji} {timeOfDay.label}</p>
                <motion.div
                  key={totalMinutes}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="text-5xl md:text-6xl font-display font-bold text-primary dice-glow"
                >
                  {days > 0 && <span className="text-3xl text-muted-foreground">{days}d </span>}
                  {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                </motion.div>
                <p className="text-muted-foreground mt-2">Tempo no jogo</p>

                <div className="mt-4 mx-auto max-w-xs">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 via-50% to-blue-500"
                      animate={{ width: `${dayProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>🌙 00h</span>
                    <span>🌅 06h</span>
                    <span>☀️ 12h</span>
                    <span>🌇 18h</span>
                    <span>🌙 24h</span>
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

              <div className="flex gap-3">
                <Button onClick={toggle} className="flex-1 gap-2" size="lg">
                  {timer.isRunning ? <><Pause className="w-4 h-4" />Pausar</> : <><Play className="w-4 h-4" />Iniciar</>}
                </Button>
                <Button onClick={reset} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GameTimer;
