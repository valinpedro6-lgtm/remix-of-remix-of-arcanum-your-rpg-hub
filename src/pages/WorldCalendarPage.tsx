import { motion } from 'framer-motion';
import { CalendarDays, Plus, Trash2, RotateCcw, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NumberInput } from '@/components/NumberInput';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  WorldCalendar, DEFAULT_CALENDAR, EARTH_CALENDAR, newMonth, yearLength, worldDate,
} from '@/lib/worldCalendar';

interface TimerState {
  realMinutesPerGameHour: number;
  isRunning: boolean;
  gameMinutesElapsed: number;
  lastTickTimestamp: number;
}

const WorldCalendarPage = () => {
  const [cal, setCal] = useLocalStorage<WorldCalendar>('arcanum-calendar', DEFAULT_CALENDAR());
  const [timer] = useLocalStorage<TimerState>('arcanum-timer', {
    realMinutesPerGameHour: 1, isRunning: false, gameMinutesElapsed: 0, lastTickTimestamp: 0,
  });

  const daysElapsed = Math.floor(timer.gameMinutesElapsed / 1440);
  const today = worldDate(cal, daysElapsed);
  const total = yearLength(cal);

  const patch = (p: Partial<WorldCalendar>) => setCal(prev => ({ ...prev, ...p }));
  const setMonth = (id: string, p: Partial<{ name: string; days: number }>) =>
    setCal(prev => ({ ...prev, months: prev.months.map(m => (m.id === id ? { ...m, ...p } : m)) }));

  const startMonthDays = Math.max(1, cal.months[cal.startMonth]?.days ?? 30);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Calendário do Mundo</h1>
        <p className="text-sm text-muted-foreground mt-1">Monte os meses, os dias e o ano do seu cenário</p>
      </motion.div>

      {/* Data atual */}
      <Card className="glow-border">
        <CardContent className="p-5 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
            <CalendarDays className="w-4 h-4" /> Data atual no jogo
          </div>
          <p className="text-2xl md:text-4xl font-display font-bold text-primary dice-glow">
            {today.day} de {today.monthName}
          </p>
          <p className="text-sm text-muted-foreground">
            Ano {today.year}{cal.eraSuffix ? ` ${cal.eraSuffix}` : ''} · {today.weekday} · dia {today.dayOfYear} de {total}
          </p>
          <Badge variant="outline" className="mt-1 text-[10px]">
            {daysElapsed} dia(s) desde o início do timer
          </Badge>
        </CardContent>
      </Card>

      {/* Configuração geral */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome do calendário</Label>
              <Input value={cal.name} onChange={e => patch({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Sufixo da era (opcional)</Label>
              <Input value={cal.eraSuffix} onChange={e => patch({ eraSuffix: e.target.value })} placeholder="Ex: A.T., d.C." />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Dia em que o timer começa</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Dia</span>
                <NumberInput min={1} value={cal.startDay} onChange={v => patch({ startDay: Math.min(Math.max(1, v), startMonthDays) })} />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Mês</span>
                <select
                  className="h-10 w-full rounded-md bg-background border border-border px-3 text-sm"
                  value={cal.startMonth}
                  onChange={e => patch({ startMonth: Number(e.target.value) })}
                >
                  {cal.months.map((m, i) => <option key={m.id} value={i}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Ano</span>
                <NumberInput value={cal.startYear} onChange={v => patch({ startYear: v })} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setCal(DEFAULT_CALENDAR())}>
              <RotateCcw className="w-3.5 h-3.5" /> Modelo simples (12 × 30)
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setCal(EARTH_CALENDAR())}>
              <Globe className="w-3.5 h-3.5" /> Modelo terrestre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meses */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Meses ({cal.months.length})</Label>
              <p className="text-xs text-muted-foreground">O ano tem {total} dias</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setCal(p => ({ ...p, months: [...p.months, newMonth(p.months.length + 1)] }))}>
              <Plus className="w-3.5 h-3.5" /> Novo mês
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {cal.months.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2">
                <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                <Input className="h-9 flex-1" value={m.name} onChange={e => setMonth(m.id, { name: e.target.value })} />
                <NumberInput className="h-9 w-20" min={1} value={m.days} onChange={v => setMonth(m.id, { days: Math.max(1, v) })} />
                <span className="text-xs text-muted-foreground">dias</span>
                <Button
                  variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0"
                  disabled={cal.months.length <= 1}
                  onClick={() => setCal(p => ({
                    ...p,
                    months: p.months.filter(x => x.id !== m.id),
                    startMonth: Math.min(p.startMonth, p.months.length - 2),
                  }))}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dias da semana */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Dias da semana ({cal.weekdays.length})</Label>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => patch({ weekdays: [...cal.weekdays, `Dia ${cal.weekdays.length + 1}`] })}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {cal.weekdays.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="h-9"
                  value={w}
                  onChange={e => patch({ weekdays: cal.weekdays.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                <Button
                  variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0"
                  disabled={cal.weekdays.length <= 1}
                  onClick={() => patch({ weekdays: cal.weekdays.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visão do mês atual */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Label>{cal.months[today.monthIndex]?.name} — ano {today.year}</Label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: Math.max(1, cal.months[today.monthIndex]?.days ?? 30) }, (_, i) => i + 1).map(d => (
              <div
                key={d}
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-semibold border ${
                  d === today.day
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_14px_hsl(var(--primary)/0.5)]'
                    : 'bg-secondary/30 border-border/40 text-muted-foreground'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorldCalendarPage;
