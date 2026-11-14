const TIME_ZONE = 'America/Sao_Paulo';

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
  return Number.isNaN(date.getTime()) ? 'data indisponível' : dateTime.format(date);
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
