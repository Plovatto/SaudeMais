import { useId } from 'react';
import { LuCalendarSync, LuCircleX, LuFileText, LuMapPin, LuPhone } from 'react-icons/lu';
import { CancellationNote, Detail, Note, PhoneLink } from '@components/bookings/BookingDetails';
import { bookingTitle } from '@components/bookings/booking-display';
import { BookingHeadline } from '@components/bookings/BookingHeadline';
import { ExpandableCard } from '@components/bookings/ExpandableCard';
import { rescheduleBlockedNotes, reschedulesLeftText } from '@components/bookings/reschedule-text';
import { Button, ButtonLink, FormAlert } from '@components/ui';
import { areas, examResultUrl } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { blockedNotes } from './booking-text';

export interface BookingCardProps {
  booking: PatientBooking;
  onCancel: (booking: PatientBooking) => void;
}

const rescheduleUrl = ({ kind, id }: PatientBooking) =>
  `${areas.patient.base}/${kind === 'exam' ? 'exames' : 'consultas'}/${id}/reagendar`;

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const leftId = useId();
  const { title } = bookingTitle(booking);
  const { unit, notes, publicCode, cancellation, actions } = booking;
  const target = `: ${[title, booking.examType?.name, formatDateTime(booking.startsAt)].filter(Boolean).join(', ')}`;
  const blocked = [
    actions.cancelBlockedReason && blockedNotes[actions.cancelBlockedReason],
    actions.rescheduleBlockedReason && rescheduleBlockedNotes[actions.rescheduleBlockedReason],
  ].filter(Boolean);
  return (
    <ExpandableCard
      headline={<BookingHeadline booking={booking} />}
      actions={
        booking.hasResult && (
          <ButtonLink to={examResultUrl(booking.id)} variant="secondary" className="self-start">
            <LuFileText aria-hidden />
            Ver resultado
            <span className="sr-only">{target}</span>
          </ButtonLink>
        )
      }
    >
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
      {blocked.map((note) => (
        <FormAlert key={note} tone="warning" role="note">
          {note}
        </FormAlert>
      ))}
      {(actions.canReschedule || actions.canCancel) && (
        <div className="flex flex-wrap items-center gap-3">
          {actions.canReschedule && (
            <ButtonLink to={rescheduleUrl(booking)} variant="secondary" aria-describedby={leftId}>
              <LuCalendarSync aria-hidden />
              Reagendar
              <span className="sr-only">{target}</span>
            </ButtonLink>
          )}
          {actions.canCancel && (
            <Button variant="danger-outline" icon={<LuCircleX />} onClick={() => onCancel(booking)}>
              Cancelar
              <span className="sr-only">{target}</span>
            </Button>
          )}
        </div>
      )}
      {actions.canReschedule && (
        <p id={leftId} className="text-text-secondary text-sm">
          {reschedulesLeftText(actions.reschedulesLeft)}
        </p>
      )}
    </ExpandableCard>
  );
}
