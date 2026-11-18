import { useSearchParams } from 'react-router';
import { DEFAULT_PRESET, matchPreset, presetPeriod } from '@components/reports/report-periods';
import type { Period } from '@components/reports/reports-api';
import { useSetSearchParams } from '@hooks/useSearchParam';

export function usePeriod() {
  const [params] = useSearchParams();
  const setParams = useSetSearchParams();
  const from = params.get('de') ?? '';
  const to = params.get('ate') ?? '';
  const period = from || to ? { from, to } : presetPeriod(DEFAULT_PRESET);
  const preset = matchPreset(period);
  const setPeriod = (next: Period, options?: { replace?: boolean }) =>
    setParams({ de: next.from, ate: next.to }, options);
  return { period, preset, setPeriod };
}
