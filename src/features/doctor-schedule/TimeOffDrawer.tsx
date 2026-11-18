import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { LuCalendar, LuPencilLine } from 'react-icons/lu';
import { FormShell } from '@components/forms/FormShell';
import { Drawer, Input, useToast } from '@components/ui';
import { addDays, todayInSaoPaulo } from '@lib/date';
import { useFormSubmit } from '@lib/useFormSubmit';
import { timeOffApi, timeOffQuery, type ScheduleWarning } from './schedule-api';
import { REASON_MAX, timeOffSchema, toTimeOffBody, type TimeOffValues } from './time-off-schema';

const DAYS_AHEAD = 365;

interface TimeOffFormProps {
  onClose: () => void;
  onCreated: (warnings: ScheduleWarning[]) => void;
}

function TimeOffForm({ onClose, onCreated }: TimeOffFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const today = todayInSaoPaulo();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TimeOffValues>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: { date: '', reason: '' },
  });
  const { alert, run } = useFormSubmit(setError, ['date', 'reason']);

  const submit = handleSubmit((values) =>
    run(async () => {
      const { warnings } = await timeOffApi.create(toTimeOffBody(values));
      await queryClient.invalidateQueries({ queryKey: timeOffQuery.queryKey });
      onCreated(warnings);
      onClose();
      show({ message: 'Data bloqueada.', tone: 'success' });
    }),
  );

  return (
    <FormShell
      label="Bloquear uma data"
      onSubmit={submit}
      alert={alert}
      submitting={isSubmitting}
      onCancel={onClose}
      submitLabel="Bloquear data"
    >
      <p className="text-text-secondary text-[0.8125rem]">
        Os pacientes deixam de ver horários livres no dia. Consultas já marcadas continuam na sua agenda.
      </p>
      <Input
        label="Data"
        type="date"
        icon={<LuCalendar />}
        min={today}
        max={addDays(today, DAYS_AHEAD)}
        error={errors.date?.message}
        {...register('date')}
      />
      <Input
        label="Motivo"
        icon={<LuPencilLine />}
        hint="Opcional. Só você vê."
        placeholder="Ex.: Congresso, férias"
        maxLength={REASON_MAX}
        error={errors.reason?.message}
        {...register('reason')}
      />
    </FormShell>
  );
}

export interface TimeOffDrawerProps extends TimeOffFormProps {
  open: boolean;
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function TimeOffDrawer({ open, fallbackFocus, ...props }: TimeOffDrawerProps) {
  return (
    <Drawer open={open} onClose={props.onClose} title="Bloquear uma data" fallbackFocus={fallbackFocus}>
      {open && <TimeOffForm {...props} />}
    </Drawer>
  );
}
