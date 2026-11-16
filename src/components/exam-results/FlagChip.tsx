import { LuArrowDown, LuArrowUp, LuCircleCheck, LuOctagonAlert } from 'react-icons/lu';
import type { StatusDisplay } from '@components/bookings/booking-display';
import { StatusChip } from '@components/ui';
import type { ResultItem } from './ResultVersion';

const flags: Record<ResultItem['flag'], StatusDisplay> = {
  normal: { label: 'Normal', tone: 'success', icon: <LuCircleCheck /> },
  low: { label: 'Baixo', tone: 'warning', icon: <LuArrowDown /> },
  high: { label: 'Alto', tone: 'warning', icon: <LuArrowUp /> },
  critical: { label: 'Crítico', tone: 'danger', icon: <LuOctagonAlert /> },
};

export function FlagChip({ flag }: { flag: ResultItem['flag'] }) {
  const { label, tone, icon } = flags[flag];
  return (
    <StatusChip tone={tone} icon={icon}>
      {label}
    </StatusChip>
  );
}
