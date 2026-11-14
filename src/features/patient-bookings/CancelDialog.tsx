import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Dialog, FormAlert, Textarea, useToast } from '@components/ui';
import { ApiError } from '@lib/api/api-error';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { FREE_TEXT_MAX, freeText } from '@lib/validation/text';
import { bookingSummary } from './booking-text';
import { bookingsApi, type PatientBooking } from './bookings-api';

const cancelSchema = z.object({ reason: freeText() });

type CancelValues = z.infer<typeof cancelSchema>;

const cancelMessages = { NOT_FOUND: 'Este agendamento não existe mais. Confira a lista atualizada.' };

const STALE_STATUSES = new Set([404, 409]);

export interface CancelDialogProps {
  booking: PatientBooking | null;
  onClose: () => void;
  fallbackFocus: RefObject<HTMLElement | null>;
}

function CancelForm({ booking, onClose }: { booking: PatientBooking; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const [stale, setStale] = useState(false);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.booking.availabilities }),
    ]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CancelValues>({ resolver: zodResolver(cancelSchema), defaultValues: { reason: '' } });
  const { alert, run } = useFormSubmit(
    setError,
    ['reason'],
    (error) => {
      if (error instanceof ApiError && STALE_STATUSES.has(error.status)) {
        setStale(true);
        void refresh();
      }
      return false;
    },
    cancelMessages,
  );

  const onSubmit = handleSubmit(({ reason }) =>
    run(async () => {
      await bookingsApi.cancel(booking.id, booking.startsAt, reason);
      show({ message: 'Agendamento cancelado.', tone: 'success' });
      await refresh();
      onClose();
    }),
  );

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      {booking.actions.lateCancellation && (
        <FormAlert tone="warning" role="note">
          O horário está dentro do prazo mínimo de cancelamento. Este cancelamento ficará registrado como
          tardio.
        </FormAlert>
      )}
      <Textarea
        label="Motivo (opcional)"
        maxLength={FREE_TEXT_MAX}
        disabled={stale}
        error={errors.reason?.message}
        {...register('reason')}
      />
      {alert && <FormAlert>{alert}</FormAlert>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Voltar
        </Button>
        {!stale && (
          <Button type="submit" variant="danger" loading={isSubmitting}>
            Cancelar agendamento
          </Button>
        )}
      </div>
    </form>
  );
}

export function CancelDialog({ booking, onClose, fallbackFocus }: CancelDialogProps) {
  return (
    <Dialog
      open={booking !== null}
      onClose={onClose}
      title={booking?.kind === 'exam' ? 'Cancelar exame?' : 'Cancelar consulta?'}
      description={booking && bookingSummary(booking)}
      fallbackFocus={fallbackFocus}
    >
      {booking && <CancelForm key={booking.id} booking={booking} onClose={onClose} />}
    </Dialog>
  );
}
