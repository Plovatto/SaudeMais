import { ListRow, StatusChip } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { formatShortDay } from '@lib/date';
import { bookingMeta, bookingStatus, bookingTitle, isMuted } from './booking-display';
import { DateTile } from './DateTile';

type BookingRowProps = { booking: PatientBooking; selected?: boolean } & (
  { to: string; onSelect?: undefined } | { to?: undefined; onSelect: () => void; opensDialog?: boolean }
);

export function BookingRow(props: BookingRowProps) {
  const { booking, selected = false } = props;
  const status = bookingStatus(booking, 'patient');
  const chip = <StatusChip tone={status.tone}>{status.label}</StatusChip>;
  const content = {
    selected,
    leading: <DateTile startsAt={booking.startsAt} muted={isMuted(booking)} />,
    title: (
      <>
        <span className="sr-only">{formatShortDay(booking.startsAt)}, </span>
        {bookingTitle(booking).title}
      </>
    ),
    meta: (
      <>
        {bookingMeta(booking)}
        <span className="mt-2 flex">{chip}</span>
      </>
    ),
  };
  return props.to !== undefined ? (
    <ListRow to={props.to} {...content} />
  ) : (
    <ListRow onClick={props.onSelect} aria-haspopup={props.opensDialog ? 'dialog' : undefined} {...content} />
  );
}
