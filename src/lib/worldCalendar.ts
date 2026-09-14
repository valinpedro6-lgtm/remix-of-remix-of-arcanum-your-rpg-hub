export interface WorldMonth {
  id: string;
  name: string;
  days: number;
}

export interface WorldCalendar {
  /** Nome do calendário do mundo */
  name: string;
  months: WorldMonth[];
  weekdays: string[];
  /** Data em que o timer começa a contar */
  startYear: number;
  startMonth: number; // índice do mês
  startDay: number;   // 1..days do mês
  eraSuffix: string;  // ex: "d.C.", "A.T."
}

const mid = () => Math.random().toString(36).slice(2, 9);

export const EARTH_MONTHS = [
  ['Janeiro', 31], ['Fevereiro', 28], ['Março', 31], ['Abril', 30], ['Maio', 31], ['Junho', 30],
  ['Julho', 31], ['Agosto', 31], ['Setembro', 30], ['Outubro', 31], ['Novembro', 30], ['Dezembro', 31],
] as const;

export const DEFAULT_CALENDAR = (): WorldCalendar => ({
  name: 'Calendário do Mundo',
  months: Array.from({ length: 12 }, (_, i) => ({ id: mid(), name: `Mês ${i + 1}`, days: 30 })),
  weekdays: ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6', 'Dia 7'],
  startYear: 1,
  startMonth: 0,
  startDay: 1,
  eraSuffix: '',
});

export const EARTH_CALENDAR = (): WorldCalendar => ({
  name: 'Calendário Terrestre',
  months: EARTH_MONTHS.map(([name, days]) => ({ id: mid(), name, days: days as number })),
  weekdays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
  startYear: 2026,
  startMonth: 0,
  startDay: 1,
  eraSuffix: 'd.C.',
});

export const newMonth = (n: number): WorldMonth => ({ id: mid(), name: `Mês ${n}`, days: 30 });

export const yearLength = (c: WorldCalendar) =>
  c.months.reduce((sum, m) => sum + Math.max(1, m.days), 0);

export interface WorldDate {
  year: number;
  monthIndex: number;
  monthName: string;
  day: number;
  weekday: string;
  dayOfYear: number;
}

/** Converte "dias passados desde o início" na data do mundo. */
export function worldDate(c: WorldCalendar, daysElapsed: number): WorldDate {
  const months = c.months.length ? c.months : DEFAULT_CALENDAR().months;
  const len = yearLength({ ...c, months });

  // dia absoluto (0-based) dentro do ano inicial
  let offset = 0;
  for (let i = 0; i < Math.min(c.startMonth, months.length); i++) offset += Math.max(1, months[i].days);
  offset += Math.max(1, c.startDay) - 1;

  let total = offset + Math.max(0, Math.floor(daysElapsed));
  const year = c.startYear + Math.floor(total / len);
  let rest = ((total % len) + len) % len;
  const dayOfYear = rest + 1;

  let monthIndex = 0;
  for (let i = 0; i < months.length; i++) {
    const d = Math.max(1, months[i].days);
    if (rest < d) { monthIndex = i; break; }
    rest -= d;
    monthIndex = i;
  }

  const weekdays = c.weekdays.length ? c.weekdays : ['Dia'];
  return {
    year,
    monthIndex,
    monthName: months[monthIndex]?.name ?? '—',
    day: rest + 1,
    weekday: weekdays[(total % weekdays.length + weekdays.length) % weekdays.length],
    dayOfYear,
  };
}

export const formatWorldDate = (c: WorldCalendar, daysElapsed: number) => {
  const d = worldDate(c, daysElapsed);
  return `${d.day} de ${d.monthName}, ano ${d.year}${c.eraSuffix ? ' ' + c.eraSuffix : ''}`;
};
