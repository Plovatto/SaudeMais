import { plural } from './plural';

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

const shortDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });

const fullDate = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const utcDay = (date: string) => new Date(`${date}T00:00:00.000Z`);

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? INVALID_DATE : dateTime.format(date);
}

export function formatTime(iso: string): string {
  return timeOfDay.format(new Date(iso));
}

function partsOf(format: Intl.DateTimeFormat, instant: Date) {
  const parts = format.formatToParts(instant);
  return (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
}

export function civilDateInSaoPaulo(instant: Date): string {
  const part = partsOf(civilDate, instant);
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function todayInSaoPaulo(now = new Date()): string {
  return civilDateInSaoPaulo(now);
}

export function addDays(date: string, days: number): string {
  const value = utcDay(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDay(date: string): string {
  return dayLabel.format(utcDay(date));
}

export function formatDate(date: string, { year = true } = {}): string {
  return (year ? fullDate : shortDate).format(utcDay(date));
}

export const formatCivilDate = (iso: string, options?: { year?: boolean }) =>
  formatDate(civilDateInSaoPaulo(new Date(iso)), options);

const relativeTime = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto', style: 'short' });
const relativeSpan = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'always' });

export const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RELATIVE_DAYS = 7;

function relativeOr(iso: string, now: Date, older: (date: Date, days: number) => string): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();
  if (Number.isNaN(elapsed)) return INVALID_DATE;
  if (elapsed < MINUTE_MS) return relativeTime.format(0, 'second');
  if (elapsed < HOUR_MS) return relativeTime.format(-Math.floor(elapsed / MINUTE_MS), 'minute');
  if (elapsed < DAY_MS) return relativeTime.format(-Math.floor(elapsed / HOUR_MS), 'hour');
  const days =
    (utcDay(todayInSaoPaulo(now)).getTime() - utcDay(civilDateInSaoPaulo(date)).getTime()) / DAY_MS;
  return days > RELATIVE_DAYS ? older(date, days) : relativeTime.format(-days, 'day');
}

export const formatRelative = (iso: string, now = new Date()) =>
  relativeOr(iso, now, (date) => dateTime.format(date));

const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

function spanSince(days: number): string {
  if (days < DAYS_PER_MONTH) return relativeSpan.format(-Math.floor(days / DAYS_PER_WEEK), 'week');
  if (days < DAYS_PER_YEAR) return relativeSpan.format(-Math.floor(days / DAYS_PER_MONTH), 'month');
  return relativeSpan.format(-Math.floor(days / DAYS_PER_YEAR), 'year');
}

export const formatSince = (iso: string, now = new Date()) =>
  relativeOr(iso, now, (date) => `em ${formatDate(civilDateInSaoPaulo(date))}`);

export const formatAgo = (iso: string, now = new Date()) =>
  relativeOr(iso, now, (_date, days) => spanSince(days));

const zonedParts = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const civilDay = (iso: string) => partsOf(dayLabel, utcDay(civilDateInSaoPaulo(new Date(iso))));

export function dayTile(iso: string): { weekday: string; day: string } {
  const part = civilDay(iso);
  return { weekday: part('weekday').replace('.', ''), day: part('day') };
}

export function formatShortDay(iso: string): string {
  const part = civilDay(iso);
  return `${capitalize(part('weekday').replace('.', ''))}, ${part('day')}/${part('month')}`;
}

export const whenText = (iso: string) => `${formatShortDay(iso)} às ${formatTime(iso)}`;

export const middayOf = (date: string) => `${date}T15:00:00.000Z`;

export function formatLongDay(iso: string): string {
  const part = partsOf(zonedParts, new Date(iso));
  return `${capitalize(part('weekday').replace('-feira', ''))}, ${part('day')} de ${part('month')}`;
}

const monthYear = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, month: 'long', year: 'numeric' });

export function formatMonth(iso: string): string {
  const part = partsOf(monthYear, new Date(iso));
  return `${capitalize(part('month'))} de ${part('year')}`;
}

export function formatDuration(startsAt: string, endsAt: string): string {
  const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / MINUTE_MS);
  return plural(minutes, 'minuto', 'minutos');
}
