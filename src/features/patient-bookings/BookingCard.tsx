import { LuCircleX, LuMapPin, LuPhone } from 'react-icons/lu';
import { CancellationNote, Detail, Note, PhoneLink } from '@components/bookings/BookingDetails';
import { bookingTitle } from '@components/bookings/booking-display';
import { BookingHeadline } from '@components/bookings/BookingHeadline';
import { ExpandableCard } from '@components/bookings/ExpandableCard';
import { Button, FormAlert } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { blockedNotes } from './booking-text';

export interface BookingCardProps {
  booking: PatientBooking;
  onCancel: (booking: PatientBooking) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const { title } = bookingTitle(booking);
  const { unit, notes, publicCode, cancellation, actions } = booking;
  const blocked = actions.cancelBlockedReason && blockedNotes[actions.cancelBlockedReason];

  return (
    <ExpandableCard headline={<BookingHeadline booking={booking} />}>
      <dl className="text-text-secondary flex flex-col gap-3 text-sm">
        <Detail icon={<LuMapPin />} label="Local">
          <span className="text-text block font-medium">{unit.name}</span>
          {unit.address}
        </Detail>
        <Detail icon={<LuPhone />} label="Telefone">
          <PhoneLink phone={unit.phone} />
        </Detail>
        {publicCode && <Note label="Código do exame">{publicCode}</Note>}
        {notes && <Note label="Observações">{notes}</Note>}
        {cancellation && <CancellationNote cancellation={cancellation} viewer="patient" />}
      </dl>
      {blocked && (
        <FormAlert tone="warning" role="note">
          {blocked}
        </FormAlert>
      )}
      {actions.canCancel && (
        <Button variant="danger-outline" icon={<LuCircleX />} onClick={() => onCancel(booking)}>
          Cancelar
          <span className="sr-only">
            : {title}, {formatDateTime(booking.startsAt)}
          </span>
        </Button>
      )}
    </ExpandableCard>
  );
}
