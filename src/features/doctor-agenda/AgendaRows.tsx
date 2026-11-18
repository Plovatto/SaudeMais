import { Fragment, type ReactNode } from 'react';
import { bookingStatus, hasStarted } from '@components/bookings/booking-display';
import { DateTile } from '@components/bookings/DateTile';
import { ListRow, StatusChip } from '@components/ui';
import { groupHeader, overline } from '@components/ui/styles';
import { visitTypeLabels } from '@constants/visit-types';
import type { DoctorAppointment } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatTime } from '@lib/date';
import { groupConsecutive } from '@lib/group';

function NowLine({ now }: { now: Date }) {
  return (
    <li className="text-danger-text after:bg-danger flex items-center gap-2.5 px-4 py-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase after:h-px after:flex-1 after:opacity-45 lg:px-5">
      Agora · {formatTime(now.toISOString())}
    </li>
  );
}

export interface AgendaRowProps {
  appointment: DoctorAppointment;
  now: Date;
  selected?: boolean;
  opensDialog?: boolean;
  onView: (appointment: DoctorAppointment) => void;
}

export function AgendaRow({
  appointment,
  now,
  selected = false,
  opensDialog = true,
  onView,
}: AgendaRowProps) {
  const status = bookingStatus(appointment, 'doctor', now.getTime());
  return (
    <ListRow
      onClick={() => onView(appointment)}
      aria-haspopup={opensDialog ? 'dialog' : undefined}
      selected={selected}
      className="flex-wrap gap-y-2"
      leading={
        <DateTile startsAt={appointment.startsAt} muted={hasStarted(appointment.startsAt, now.getTime())} />
      }
      title={appointment.patient.fullName}
      meta={
        <>
          <time dateTime={appointment.startsAt} className="text-text font-semibold">
            {formatTime(appointment.startsAt)}
          </time>{' '}
          · {visitTypeLabels[appointment.visitType]}
        </>
      }
      trailing={
        <span className="flex shrink-0 @max-[25rem]:order-last @max-[25rem]:basis-full @max-[25rem]:ps-[66px]">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </span>
      }
    />
  );
}

export interface AgendaRowsProps {
  items: readonly DoctorAppointment[];
  now: Date;
  showNow: boolean;
  groupOf?: (appointment: DoctorAppointment) => string;
  row: (appointment: DoctorAppointment) => ReactNode;
}

export function AgendaRows({ items, now, showNow, groupOf, row }: AgendaRowsProps) {
  const upcoming = items.findIndex(({ startsAt }) => new Date(startsAt) > now);
  const nowAt = showNow ? (upcoming === -1 ? items.length : upcoming) : -1;
  const groups = groupConsecutive(
    items.map((appointment, index) => ({ appointment, index })),
    ({ appointment }) => groupOf?.(appointment) ?? '',
  );
  return (
    <ul className="divide-border divide-y">
      {groups.map(({ key, items: entries }) =>
        entries.map(({ appointment, index }, position) => (
          <Fragment key={appointment.id}>
            {index === nowAt && <NowLine now={now} />}
            {position === 0 && key && <li className={cx(groupHeader, overline)}>{key}</li>}
            <li className="@container">{row(appointment)}</li>
          </Fragment>
        )),
      )}
      {nowAt === items.length && <NowLine now={now} />}
    </ul>
  );
}
