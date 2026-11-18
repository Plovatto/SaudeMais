import { FormAlert } from '@components/ui';
import { formatDateTime } from '@lib/date';
import { plural } from '@lib/plural';
import type { ScheduleWarning } from './schedule-api';

export interface WarningAlertProps {
  warnings: readonly ScheduleWarning[];
  one: string;
  many: string;
}

export function WarningAlert({ warnings, one, many }: WarningAlertProps) {
  if (warnings.length === 0) return null;
  const dates = warnings.map((warning) => formatDateTime(warning.startsAt)).join('; ');
  return (
    <FormAlert tone="warning">
      {`${plural(warnings.length, one, many)}: ${dates}. Nada foi cancelado; confira cada uma na sua agenda.`}
    </FormAlert>
  );
}
