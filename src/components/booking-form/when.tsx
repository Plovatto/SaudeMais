import { LuCalendar } from 'react-icons/lu';
import type { InfoItem } from '@components/ui';
import { whenText } from '@lib/date';

export const whenItem = (startsAt: string): InfoItem => ({
  key: 'when',
  icon: <LuCalendar />,
  label: 'Data e horário',
  value: startsAt ? (
    <span className="tabular-nums">{whenText(startsAt)}</span>
  ) : (
    <span className="text-text-muted">Escolha dia e horário</span>
  ),
});
