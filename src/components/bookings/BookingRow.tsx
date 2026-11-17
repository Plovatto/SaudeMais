import type { ComponentProps } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { StatusChip } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';
import { hasStarted, bookingMeta, bookingStatus, bookingTitle } from './booking-display';
import { DateTile } from './DateTile';

const rowClass = (selected: boolean) =>
  cx(
    'group relative flex w-full min-w-0 items-center gap-3.5 px-4 py-3.5 text-start transition-colors duration-150 lg:px-5',
    selected
      ? 'bg-role-soft/60 before:bg-role-strong before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-e-[3px]'
      : 'can-hover:bg-surface-muted',
  );

function RowContent({ booking }: { booking: PatientBooking }) {
  const status = bookingStatus(booking, 'patient');
  return (
    <>
      <DateTile
        startsAt={booking.startsAt}
        muted={hasStarted(booking.startsAt) || booking.status === 'cancelled'}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-text truncate text-sm font-semibold">{bookingTitle(booking).title}</span>
        <span className="text-text-secondary truncate text-[0.8125rem] tabular-nums">
          {bookingMeta(booking)}
        </span>
      </span>
      <StatusChip tone={status.tone}>{status.label}</StatusChip>
      <LuChevronRight
        aria-hidden
        className="text-text-muted size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </>
  );
}

type RowProps = { booking: PatientBooking; selected?: boolean } & (
  | ({ to: string } & Omit<ComponentProps<typeof Link>, 'to' | 'children'>)
  | ({ to?: undefined } & Omit<ComponentProps<'button'>, 'children'>)
);

export function BookingRow({ booking, selected = false, className, ...props }: RowProps) {
  if (props.to !== undefined) {
    return (
      <Link {...props} className={cx(rowClass(selected), className)}>
        <RowContent booking={booking} />
      </Link>
    );
  }
  const { to: _to, ...buttonProps } = props;
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...buttonProps}
      className={cx(rowClass(selected), className)}
    >
      <RowContent booking={booking} />
    </button>
  );
}
