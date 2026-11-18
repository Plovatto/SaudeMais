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

export function hourInSaoPaulo(iso: string): number {
  return Number(partsOf(timeOfDay, new Date(iso))('hour'));
}

export function isCivilDate(value: string): boolean {
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(time) && new Date(time).toISOString().startsWith(value)
  );
}

export const weekdayOf = (date: string) => utcDay(date).getUTCDay();

export function addDays(date: string, days: number): string {
  const value = utcDay(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export const daysBetween = (from: string, to: string) =>
  Math.round((utcDay(to).getTime() - utcDay(from).getTime()) / DAY_MS);

export function formatDate(date: string, { year = true } = {}): string {
  return (year ? fullDate : shortDate).format(utcDay(date));
}

export const formatCivilDate = (iso: string, options?: { year?: boolean }) =>
  formatDate(civilDateInSaoPaulo(new Date(iso)), options);

const relativeTime = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto', style: 'short' });
const relativeSpan = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'always' });
const relativeLong = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
const RELATIVE_DAYS = 7;

function relativeOr(
  iso: string,
  now: Date,
  older: (date: Date, days: number) => string,
  { format = relativeTime, relativeDays = RELATIVE_DAYS } = {},
): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();
  if (Number.isNaN(elapsed)) return INVALID_DATE;
  if (elapsed < MINUTE_MS) return format.format(0, 'second');
  if (elapsed < HOUR_MS) return format.format(-Math.floor(elapsed / MINUTE_MS), 'minute');
  if (elapsed < DAY_MS) return format.format(-Math.floor(elapsed / HOUR_MS), 'hour');
  const days =
    (utcDay(todayInSaoPaulo(now)).getTime() - utcDay(civilDateInSaoPaulo(date)).getTime()) / DAY_MS;
  return days > relativeDays ? older(date, days) : format.format(-days, 'day');
}

export const formatRelative = (iso: string, now = new Date()) =>
  relativeOr(iso, now, (date) => dateTime.format(date));

const DAYS_PER_WEEK = 7;

export function weekOf(date: string): string[] {
  const monday = addDays(date, -((weekdayOf(date) + 6) % DAYS_PER_WEEK));
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(monday, index));
}

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

function spanSince(days: number): string {
  if (days < DAYS_PER_MONTH) return relativeSpan.format(-Math.floor(days / DAYS_PER_WEEK), 'week');
  if (days < DAYS_PER_YEAR) return relativeSpan.format(-Math.floor(days / DAYS_PER_MONTH), 'month');
  return relativeSpan.format(-Math.floor(days / DAYS_PER_YEAR), 'year');
}

const SINCE_DAYS = 13;

export const formatSince = (iso: string, now = new Date()) =>
  relativeOr(iso, now, (_date, days) => spanSince(days), { format: relativeLong, relativeDays: SINCE_DAYS });

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

const monthName = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long' });

export const formatMonthName = (date: string) => monthName.format(utcDay(date));

export function formatMonth(iso: string): string {
  const part = partsOf(monthYear, new Date(iso));
  return `${capitalize(part('month'))} de ${part('year')}`;
}

export function formatDuration(startsAt: string, endsAt: string): string {
  const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / MINUTE_MS);
  return plural(minutes, 'minuto', 'minutos');
}
