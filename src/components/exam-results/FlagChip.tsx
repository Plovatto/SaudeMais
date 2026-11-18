import { StatusChip } from '@components/ui';
import { flags } from './result-flags';
import type { ResultItem } from './ResultVersion';

export function FlagChip({ flag }: { flag: ResultItem['flag'] }) {
  const { label, tone, icon } = flags[flag];
  return (
    <StatusChip tone={tone} icon={icon}>
      {label}
    </StatusChip>
  );
}
