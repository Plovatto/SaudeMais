import type { StatusDisplay } from '@components/bookings/booking-display';
import { formatMeasurement } from '@lib/number';
import type { ResultItem } from './ResultVersion';

type Flag = ResultItem['flag'];

export const flags: Record<Flag, Omit<StatusDisplay, 'icon'> & { count: readonly [string, string] }> = {
  normal: { label: 'Normal', tone: 'success', count: ['normal', 'normais'] },
  low: { label: 'Baixo', tone: 'warning', count: ['baixo', 'baixos'] },
  high: { label: 'Alto', tone: 'danger', count: ['alto', 'altos'] },
  critical: { label: 'Crítico', tone: 'danger', count: ['crítico', 'críticos'] },
};

export const FLAG_ORDER = Object.keys(flags) as Flag[];

export const flagCount = (flag: Flag, count: number) => `${count} ${flags[flag].count[count === 1 ? 0 : 1]}`;

export const formatResultValue = (value: ResultItem['value']) =>
  typeof value === 'number' ? formatMeasurement(value) : value;
