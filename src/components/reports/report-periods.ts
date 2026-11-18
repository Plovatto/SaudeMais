import { addDays, daysBetween, formatMonthName, todayInSaoPaulo } from '@lib/date';
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

const TIE_ORDER: readonly PeriodPreset[] = ['mes', 'mes-passado', 'hoje', '7', '30', '365'];

export const isPeriodPreset = (value: string | null): value is PeriodPreset =>
  PERIOD_PRESETS.some((preset) => preset.value === value);

export function presetPeriod(preset: PeriodPreset, today = todayInSaoPaulo()): Period {
  const found = PERIOD_PRESETS.find(({ value }) => value === preset) ?? PERIOD_PRESETS[2];
  return found.period(today);
}

export function matchPreset(period: Period, today = todayInSaoPaulo()): PeriodPreset | undefined {
  return TIE_ORDER.find((value) => {
    const candidate = presetPeriod(value, today);
    return candidate.from === period.from && candidate.to === period.to;
  });
}

export function previousPeriod({ from, to }: Period): Period {
  const days = daysBetween(from, to) + 1;
  return { from: addDays(from, -days), to: addDays(from, -1) };
}

const COMPARISON_LABELS: Record<Exclude<PeriodPreset, 'mes'>, string> = {
  hoje: 'vs. dia anterior',
  '7': 'vs. semana anterior',
  '30': 'vs. 30 dias anteriores',
  'mes-passado': 'vs. mês anterior',
  '365': 'vs. ano anterior',
};

export function comparison(preset: PeriodPreset, period: Period): { period: Period; label: string } {
  if (preset === 'mes') {
    const end = addDays(period.from, -1);
    const start = monthStart(end);
    const sameDay = addDays(start, daysBetween(period.from, period.to));
    return { period: { from: start, to: sameDay < end ? sameDay : end }, label: `vs. ${formatMonthName(start)}` };
  }
  return { period: previousPeriod(period), label: COMPARISON_LABELS[preset] };
}
