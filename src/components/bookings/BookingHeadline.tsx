import { LuCalendar, LuStethoscope, LuSyringe } from 'react-icons/lu';
import { IconSlot, StatusChip } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { bookingStatus, bookingTitle } from './booking-display';

export function BookingHeadline({ booking }: { booking: PatientBooking }) {
  const status = bookingStatus(booking);
  const { title, subtitle } = bookingTitle(booking);
  return (
    <>
      <span data-role="doctor" className="contents">
        <IconSlot badge="strong" className="rounded-tile size-12 text-2xl">
          {booking.kind === 'exam' ? <LuSyringe /> : <LuStethoscope />}
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
            <time dateTime={booking.startsAt}>{formatDateTime(booking.startsAt)}</time>
          </span>
          <StatusChip tone={status.tone} icon={status.icon}>
            {status.label}
          </StatusChip>
        </span>
      </span>
    </>
  );
}
