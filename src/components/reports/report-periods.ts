import { addDays, addYears, daysBetween, formatMonthName, todayInSaoPaulo, type DateLimits } from '@lib/date';
import type { Period } from './reports-api';

export const MAX_REPORT_DAYS = 366;
export const REPORT_YEARS_BACK = 5;

export function reportLimits(today = todayInSaoPaulo()): DateLimits {
  return { min: addYears(today, -REPORT_YEARS_BACK), max: addDays(today, 365) };
}

const monthStart = (date: string) => `${date.slice(0, 8)}01`;

const yearBefore = (date: string) => `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;

const untilYesterday = (period: (yesterday: string) => Period) => (today: string) =>
  period(addDays(today, -1));

const lastDays = (days: number) =>
  untilYesterday((yesterday) => ({ from: addDays(yesterday, 1 - days), to: yesterday }));

export const PERIOD_PRESETS = [
  { value: 'hoje', label: 'Hoje', period: (today: string) => ({ from: today, to: today }) },
  { value: '7', label: '7 dias', period: lastDays(7) },
  { value: '30', label: '30 dias', period: lastDays(30) },
  {
    value: 'mes',
    label: 'Este mês',
    period: (today: string) => {
      const from = monthStart(today);
      return { from, to: today === from ? today : addDays(today, -1) };
    },
  },
  {
    value: 'mes-passado',
    label: 'Mês passado',
    period: (today: string) => {
      const end = addDays(monthStart(today), -1);
      return { from: monthStart(end), to: end };
    },
  },
  {
    value: '365',
    label: '12 meses',
    period: (today: string) => {
      const start = monthStart(today);
      return { from: yearBefore(start), to: addDays(start, -1) };
    },
  },
] as const satisfies readonly { value: string; label: string; period: (today: string) => Period }[];

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]['value'];

export const DEFAULT_PRESET = '30' satisfies PeriodPreset;

export const PANEL_PRESETS = ['7', '30', 'mes', '365'] as const satisfies readonly PeriodPreset[];

export type PanelPreset = (typeof PANEL_PRESETS)[number];

export const panelPeriod = (preset: PanelPreset, today = todayInSaoPaulo()): Period =>
  presetPeriod(preset, today);

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

function previousPeriod({ from, to }: Period): Period {
  const days = daysBetween(from, to) + 1;
  return { from: addDays(from, -days), to: addDays(from, -1) };
}

const COMPARISON_LABELS: Record<Exclude<PanelPreset, 'mes'>, string> = {
  '7': 'vs. semana anterior',
  '30': 'vs. 30 dias anteriores',
  '365': 'vs. ano anterior',
};

export function comparison(preset: PanelPreset, period: Period): { period: Period; label: string } {
  if (preset === 'mes') {
    const end = addDays(period.from, -1);
    const start = monthStart(end);
    const sameDay = addDays(start, daysBetween(period.from, period.to));
    return {
      period: { from: start, to: sameDay < end ? sameDay : end },
      label: `vs. ${formatMonthName(start)}`,
    };
  }
  if (preset === '365') {
    return {
      period: { from: yearBefore(period.from), to: addDays(period.from, -1) },
      label: COMPARISON_LABELS[preset],
    };
  }
  return { period: previousPeriod(period), label: COMPARISON_LABELS[preset] };
}
