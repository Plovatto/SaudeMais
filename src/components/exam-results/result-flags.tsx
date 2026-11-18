import type { ReactNode } from 'react';
import { LuOctagonAlert } from 'react-icons/lu';
import type { StatusChipProps } from '@components/ui';
import { formatMeasurement } from '@lib/number';
import type { ResultItem } from './ResultVersion';

type Flag = ResultItem['flag'];

interface FlagDisplay {
  label: string;
  tone: StatusChipProps['tone'];
  dot: string;
  icon?: ReactNode;
  count: readonly [string, string];
}

export const flags: Record<Flag, FlagDisplay> = {
  normal: { label: 'Normal', tone: 'success', dot: 'bg-success-text', count: ['normal', 'normais'] },
  low: { label: 'Baixo', tone: 'warning', dot: 'bg-warning-text', count: ['baixo', 'baixos'] },
  high: { label: 'Alto', tone: 'danger', dot: 'bg-danger', count: ['alto', 'altos'] },
  critical: {
    label: 'Crítico',
    tone: 'danger',
    dot: 'bg-[color-mix(in_oklab,var(--danger)_65%,var(--text))]',
    icon: <LuOctagonAlert />,
    count: ['crítico', 'críticos'],
  },
};

export const FLAG_ORDER = Object.keys(flags) as Flag[];

export const flagCount = (flag: Flag, count: number) => `${count} ${flags[flag].count[count === 1 ? 0 : 1]}`;

export const formatResultValue = (value: ResultItem['value']) =>
  typeof value === 'number' ? formatMeasurement(value) : value;
