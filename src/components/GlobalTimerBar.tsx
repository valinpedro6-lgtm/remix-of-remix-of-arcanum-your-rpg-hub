import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Link } from 'react-router-dom';
import { Play, Pause, Sun, Moon, Sunrise, Sunset } from 'lucide-react';

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

const getTimeOfDay = (hours: number) => {
  if (hours >= 6 && hours < 12) return { icon: Sunrise };
  if (hours >= 12 && hours < 18) return { icon: Sun };
  if (hours >= 18 && hours < 21) return { icon: Sunset };
  return { icon: Moon };
};

export const GlobalTimerBar = () => {
  const [timer, setTimer] = useLocalStorage<TimerState>('arcanum-timer', {
    realMinutesPerGameHour: 1,
    isRunning: false,
    gameMinutesElapsed: 0,
    lastTickTimestamp: 0,
  });

  // On mount: recover elapsed time while page was closed
  useEffect(() => {
    const raw = localStorage.getItem('arcanum-timer');
    if (!raw) return;
    try {
      const saved: TimerState = JSON.parse(raw);
      if (saved.isRunning && saved.lastTickTimestamp > 0) {
        const realMsElapsed = Date.now() - saved.lastTickTimestamp;
        const realMinutesElapsed = realMsElapsed / 60000;
        const gameMinutesGained = (realMinutesElapsed / saved.realMinutesPerGameHour) * 60;
        setTimer({
          ...saved,
          gameMinutesElapsed: saved.gameMinutesElapsed + gameMinutesGained,
          lastTickTimestamp: Date.now(),
        });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single source of truth ticker
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

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning, lastTickTimestamp: Date.now() }));
  };

  return (
    <Link
      to="/timer"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
    >
      <TimeIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-xs font-mono text-foreground">
        {days > 0 && <span className="text-muted-foreground">D{days} </span>}
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
      </span>
      <button
        onClick={toggle}
        className="p-0.5 rounded hover:bg-primary/10 transition-colors"
      >
        {timer.isRunning
          ? <Pause className="w-3 h-3 text-primary" />
          : <Play className="w-3 h-3 text-muted-foreground hover:text-primary" />
        }
      </button>
      {timer.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
    </Link>
  );
};
