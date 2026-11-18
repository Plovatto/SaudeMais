import { useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { bookingTitle } from '@components/bookings/booking-display';
import { CancelBookingDialog } from '@components/bookings/CancelBookingDialog';
import { DateTile } from '@components/bookings/DateTile';
import { FormAlert } from '@components/ui';
import { cancelAppointment, cancelExam } from '@lib/api/cancel-api';
import type { PatientBooking } from '@lib/api/models';
import { whenText } from '@lib/date';
import { queryKeys } from '@lib/query-keys';

export interface CancelDialogProps {
  booking: PatientBooking | null;
  onClose: () => void;
  fallbackFocus: RefObject<HTMLElement | null>;
}

function Summary({ booking }: { booking: PatientBooking }) {
  return (
    <div className="border-border bg-surface-muted rounded-tile flex items-center gap-3 border p-3 text-start">
      <DateTile startsAt={booking.startsAt} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-text truncate text-sm font-semibold">{bookingTitle(booking).title}</p>
        <p className="text-text-secondary text-[0.8125rem] tabular-nums">
          {`${whenText(booking.startsAt)} · ${booking.unit.name}`}
        </p>
      </div>
    </div>
  );
}

export function CancelDialog({ booking, onClose, fallbackFocus }: CancelDialogProps) {
  const queryClient = useQueryClient();
  const exam = booking?.kind === 'exam';
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.all }),
      queryClient.resetQueries({ queryKey: queryKeys.booking.availabilities }),
    ]);

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
