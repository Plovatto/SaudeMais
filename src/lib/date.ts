const TIME_ZONE = 'America/Sao_Paulo';

const INVALID_DATE = 'data indisponível';

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const timeOfDay = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const civilDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dayLabel = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

const utcDay = (date: string) => new Date(`${date}T00:00:00.000Z`);

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? INVALID_DATE : dateTime.format(date);
}

export function formatTime(iso: string): string {
  return timeOfDay.format(new Date(iso));
}

export function todayInSaoPaulo(now = new Date()): string {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    civilDate.formatToParts(now).find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addDays(date: string, days: number): string {
  const value = utcDay(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDay(date: string): string {
  return dayLabel.format(utcDay(date));
}

const relativeTime = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto', style: 'short' });

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();
  if (Number.isNaN(elapsed)) return INVALID_DATE;
  if (elapsed < MINUTE_MS) return relativeTime.format(0, 'second');
  if (elapsed < HOUR_MS) return relativeTime.format(-Math.floor(elapsed / MINUTE_MS), 'minute');
  if (elapsed < DAY_MS) return relativeTime.format(-Math.floor(elapsed / HOUR_MS), 'hour');
  const days = (utcDay(todayInSaoPaulo(now)).getTime() - utcDay(todayInSaoPaulo(date)).getTime()) / DAY_MS;
  return relativeTime.format(-days, 'day');
}
