import { addDays, daysBetween, todayInSaoPaulo } from '@lib/date';
import type { Period } from './reports-api';

const monthStart = (date: string) => `${date.slice(0, 8)}01`;

const lastDays = (days: number) => (today: string) => ({ from: addDays(today, 1 - days), to: today });

export const PERIOD_PRESETS = [
  { value: 'hoje', label: 'Hoje', period: lastDays(1) },
  { value: '7', label: '7 dias', period: lastDays(7) },
  { value: '30', label: '30 dias', period: lastDays(30) },
  { value: 'mes', label: 'Este mês', period: (today: string) => ({ from: monthStart(today), to: today }) },
  {
    value: 'mes-passado',
    label: 'Mês passado',
    period: (today: string) => {
      const end = addDays(monthStart(today), -1);
      return { from: monthStart(end), to: end };
    },
  },
  { value: '365', label: '12 meses', period: lastDays(365) },
] as const satisfies readonly { value: string; label: string; period: (today: string) => Period }[];

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]['value'];

export const DEFAULT_PRESET: PeriodPreset = '30';

export function presetPeriod(preset: PeriodPreset, today = todayInSaoPaulo()): Period {
  const found = PERIOD_PRESETS.find(({ value }) => value === preset) ?? PERIOD_PRESETS[2];
  return found.period(today);
}

export function matchPreset(period: Period, today = todayInSaoPaulo()): PeriodPreset | undefined {
  return PERIOD_PRESETS.find(({ value }) => {
    const candidate = presetPeriod(value, today);
    return candidate.from === period.from && candidate.to === period.to;
  })?.value;
}

export function previousPeriod({ from, to }: Period): Period {
  const days = daysBetween(from, to) + 1;
  return { from: addDays(from, -days), to: addDays(from, -1) };
}
