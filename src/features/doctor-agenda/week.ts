import { addDays } from '@lib/date';

const DAYS_PER_WEEK = 7;

const weekdayOf = (date: string) => new Date(`${date}T00:00:00.000Z`).getUTCDay();

export function weekOf(date: string): string[] {
  const monday = addDays(date, -((weekdayOf(date) + 6) % DAYS_PER_WEEK));
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(monday, index));
}

const PERIODS = [
  { label: 'Manhã', until: 12 },
  { label: 'Tarde', until: 18 },
  { label: 'Noite', until: 24 },
] as const;

export const periodOf = (hour: number) => PERIODS.find(({ until }) => hour < until)?.label ?? 'Noite';
