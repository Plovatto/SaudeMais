import { useSearchParams } from 'react-router';
import {
  DEFAULT_PRESET,
  isPeriodPreset,
  matchPreset,
  presetPeriod,
  type PeriodPreset,
} from '@components/reports/report-periods';
import type { Period } from '@components/reports/reports-api';
import { useSetSearchParams } from '@hooks/useSearchParam';

export function usePeriod() {
  const [params] = useSearchParams();
  const setParams = useSetSearchParams();
  const chosen = params.get('periodo');
  const from = params.get('de') ?? '';
  const to = params.get('ate') ?? '';
  const custom = !isPeriodPreset(chosen) && (from !== '' || to !== '');
  const preset = isPeriodPreset(chosen) ? chosen : custom ? undefined : DEFAULT_PRESET;
  const period = preset ? presetPeriod(preset) : { from, to };
  const selected = preset ?? matchPreset(period);
  const setPreset = (next: PeriodPreset) =>
    setParams({ periodo: next === DEFAULT_PRESET ? '' : next, de: '', ate: '' }, { replace: true });
  const setPeriod = (next: Period) => setParams({ periodo: '', de: next.from, ate: next.to });
  return { period, preset: selected, setPreset, setPeriod };
}
