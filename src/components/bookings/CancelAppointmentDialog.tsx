import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Dialog, FormAlert, Textarea, useToast } from '@components/ui';
import { cancelAppointment } from '@lib/api/appointments-api';
import { useFormSubmit } from '@lib/useFormSubmit';
import { FREE_TEXT_MAX, freeText } from '@lib/validation/text';
import { isStale, staleMessages } from './stale-appointment';

const schemas = {
  optional: z.object({ reason: freeText() }),
  required: z.object({ reason: freeText().min(1, 'Informe o motivo do cancelamento.') }),
};

type CancelValues = z.infer<typeof schemas.optional>;

interface CancelTarget {
  id: string;
  startsAt: string;
}

interface CancelFormProps {
  target: CancelTarget;
  reasonRequired: boolean;
  warning: ReactNode;
  refresh: () => Promise<unknown>;
  onClose: () => void;
}

function CancelForm({ target, reasonRequired, warning, refresh, onClose }: CancelFormProps) {
  const { show } = useToast();
  const [stale, setStale] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CancelValues>({
    resolver: zodResolver(reasonRequired ? schemas.required : schemas.optional),
    defaultValues: { reason: '' },
  });
  const { alert, run } = useFormSubmit(
    setError,
    ['reason'],
    (error) => {
      if (isStale(error)) {
        setStale(true);
        void refresh();
      }
      return false;
    },
    staleMessages,
  );

  const onSubmit = handleSubmit(({ reason }) =>
    run(async () => {
      await cancelAppointment(target.id, target.startsAt, reason);
      show({ message: 'Agendamento cancelado.', tone: 'success' });
      await refresh();
      onClose();
    }),
  );

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      {warning}
      <Textarea
        label={reasonRequired ? 'Motivo' : 'Motivo (opcional)'}
        required={reasonRequired}
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

export interface CancelAppointmentDialogProps {
  target: CancelTarget | null;
  title: string;
  summary: string | undefined;
  reasonRequired?: boolean;
  warning?: ReactNode;
  refresh: () => Promise<unknown>;
  onClose: () => void;
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function CancelAppointmentDialog({
  target,
  title,
  summary,
  reasonRequired = false,
  warning,
  refresh,
  onClose,
  fallbackFocus,
}: CancelAppointmentDialogProps) {
  return (
    <Dialog
      open={target !== null}
      onClose={onClose}
      title={title}
      description={summary}
      fallbackFocus={fallbackFocus}
    >
      {target && (
        <CancelForm
          key={target.id}
          target={target}
          reasonRequired={reasonRequired}
          warning={warning}
          refresh={refresh}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}
