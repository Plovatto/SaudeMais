const TIME = /^(?:([01]\d|2[0-3]):([0-5]\d)|(24):(00))$/;

export function isTimeOfDay(value: string): boolean {
  return TIME.test(value);
}

export function toMinutes(value: string): number {
  const match = TIME.exec(value);
  if (!match) return Number.NaN;
  const hours = Number(match[1] ?? match[3]);
  const minutes = Number(match[2] ?? match[4]);
  return hours * 60 + minutes;
}

export function formatTimeInput(value: string): string {
  if (/^\d{1,2}:\d{0,2}$/.test(value)) return value;
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
