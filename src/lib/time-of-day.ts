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

export function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
