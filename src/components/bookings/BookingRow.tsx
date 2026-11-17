import { ListRow, StatusChip } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { formatShortDay } from '@lib/date';
import { bookingMeta, bookingStatus, bookingTitle, hasStarted } from './booking-display';
import { DateTile } from './DateTile';

type BookingRowProps = { booking: PatientBooking; selected?: boolean } & (
  { to: string; onSelect?: undefined } | { to?: undefined; onSelect: () => void }
);

export function BookingRow({ booking, selected = false, to, onSelect }: BookingRowProps) {
  const status = bookingStatus(booking, 'patient');
  const content = {
    selected,
    leading: (
      <DateTile
        startsAt={booking.startsAt}
        muted={hasStarted(booking.startsAt) || booking.status === 'cancelled'}
      />
    ),
    title: (
      <>
        <span className="sr-only">{formatShortDay(booking.startsAt)}, </span>
        {bookingTitle(booking).title}
      </>
    ),
    meta: bookingMeta(booking),
    trailing: <StatusChip tone={status.tone}>{status.label}</StatusChip>,
  };
  return to !== undefined ? <ListRow to={to} {...content} /> : <ListRow onClick={onSelect} {...content} />;
}
