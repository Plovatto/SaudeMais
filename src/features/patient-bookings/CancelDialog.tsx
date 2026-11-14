import { useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { CancelAppointmentDialog } from '@components/bookings/CancelAppointmentDialog';
import { FormAlert } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { queryKeys } from '@lib/query-keys';
import { bookingSummary } from './booking-text';

export interface CancelDialogProps {
  booking: PatientBooking | null;
  onClose: () => void;
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function CancelDialog({ booking, onClose, fallbackFocus }: CancelDialogProps) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.booking.availabilities }),
    ]);

  return (
    <CancelAppointmentDialog
      target={booking}
      title={booking?.kind === 'exam' ? 'Cancelar exame?' : 'Cancelar consulta?'}
      summary={booking ? bookingSummary(booking) : undefined}
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
