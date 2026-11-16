import { useSearchParams } from 'react-router';
import { useSetSearchParams } from '@hooks/useSearchParam';
import { addDays, todayInSaoPaulo } from '@lib/date';
import type { Period } from './reports-api';

export const PRESETS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '12 meses' },
] as const;

type Preset = (typeof PRESETS)[number]['value'];

const DEFAULT_PRESET: Preset = '30';

export const presetPeriod = (preset: Preset, today = todayInSaoPaulo()): Period => ({
  from: addDays(today, 1 - Number(preset)),
  to: today,
});

export function usePeriod() {
  const [params] = useSearchParams();
  const setParams = useSetSearchParams();
  const from = params.get('de') ?? '';
  const to = params.get('ate') ?? '';
  const period = from || to ? { from, to } : presetPeriod(DEFAULT_PRESET);
  const today = todayInSaoPaulo();
  const preset = PRESETS.find(({ value }) => {
    const candidate = presetPeriod(value, today);
    return candidate.from === period.from && candidate.to === period.to;
  })?.value;
  const setPeriod = (next: Period, options?: { replace?: boolean }) =>
    setParams({ de: next.from, ate: next.to }, options);
  return { period, preset, setPeriod };
}
