import { useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { bookingTitle } from '@components/bookings/booking-display';
import { CancelBookingDialog } from '@components/bookings/CancelBookingDialog';
import { DateTile } from '@components/bookings/DateTile';
import { FormAlert, RowText } from '@components/ui';
import { cancelAppointment, cancelExam } from '@lib/api/cancel-api';
import type { PatientBooking } from '@lib/api/models';
import { whenText } from '@lib/date';
import { refreshPatientBookings } from '@lib/refresh-patient-bookings';

export interface CancelDialogProps {
  booking: PatientBooking | null;
  onClose: () => void;
  fallbackFocus: RefObject<HTMLElement | null>;
}

function Summary({ booking }: { booking: PatientBooking }) {
  return (
    <div className="border-border bg-surface-muted rounded-tile flex items-center gap-3 border p-3 text-start">
      <DateTile startsAt={booking.startsAt} />
      <RowText
        title={bookingTitle(booking).title}
        meta={`${whenText(booking.startsAt)} · ${booking.unit.name}`}
        titleClassName="truncate"
        metaClassName="tabular-nums"
      />
    </div>
  );
}

export function CancelDialog({ booking, onClose, fallbackFocus }: CancelDialogProps) {
  const queryClient = useQueryClient();
  const exam = booking?.kind === 'exam';
  const refresh = () => refreshPatientBookings(queryClient);

  return (
    <CancelBookingDialog
      target={booking}
      title={exam ? 'Cancelar o exame?' : 'Cancelar a consulta?'}
      summary="O horário fica livre para outra pessoa. Você pode agendar de novo quando quiser."
      details={booking && <Summary booking={booking} />}
      reason={exam ? 'none' : 'optional'}
      cancel={exam ? cancelExam : cancelAppointment}
      warning={
        booking?.actions.lateCancellation && (
          <FormAlert tone="warning" role="note">
            O horário está dentro do prazo mínimo de cancelamento. Este cancelamento ficará registrado como
            tardio.
          </FormAlert>
        )
      }
      refresh={refresh}
      onClose={onClose}
      fallbackFocus={fallbackFocus}
    />
  );
}
