import type { ReactNode } from 'react';
import { LuCalendar } from 'react-icons/lu';
import { IconSlot, StatusChip } from '@components/ui';
import type { Role } from '@constants/areas';
import { formatDateTime } from '@lib/date';
import type { StatusDisplay } from './booking-display';

export interface AppointmentHeadlineProps {
  iconRole: Role;
  icon: ReactNode;
  title: string;
  subtitle: string;
  startsAt: string;
  status: StatusDisplay;
}

export function AppointmentHeadline({
  iconRole,
  icon,
  title,
  subtitle,
  startsAt,
  status,
}: AppointmentHeadlineProps) {
  return (
    <>
      <span data-role={iconRole} className="contents">
        <IconSlot badge="strong" className="rounded-tile size-12 text-2xl">
          {icon}
        </IconSlot>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-text font-semibold">{title}</span>
        <span className="text-text-secondary text-sm">{subtitle}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-text-secondary flex items-center gap-1.5 text-sm whitespace-nowrap">
            <IconSlot>
              <LuCalendar />
            </IconSlot>
            <time dateTime={startsAt}>{formatDateTime(startsAt)}</time>
          </span>
          <StatusChip tone={status.tone} icon={status.icon}>
            {status.label}
          </StatusChip>
        </span>
      </span>
    </>
  );
}
