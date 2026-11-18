import type { Ref } from 'react';
import { FormAlert } from '@components/ui';
import { formatDateTime } from '@lib/date';
import { plural } from '@lib/plural';
import type { ScheduleWarning } from './schedule-api';

export interface WarningAlertProps {
  warnings: readonly ScheduleWarning[];
  one: string;
  many: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function WarningAlert({ warnings, one, many, className, ref }: WarningAlertProps) {
  if (warnings.length === 0) return null;
  const dates = warnings.map((warning) => formatDateTime(warning.startsAt)).join('; ');
  return (
    <div ref={ref} className={className}>
      <FormAlert tone="warning">
        {`${plural(warnings.length, one, many)}: ${dates}. Nada foi cancelado; confira cada uma na sua agenda.`}
      </FormAlert>
    </div>
  );
}
