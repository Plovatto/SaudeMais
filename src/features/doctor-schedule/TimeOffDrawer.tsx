import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { LuCalendar, LuPencilLine } from 'react-icons/lu';
import { FormShell } from '@components/forms/FormShell';
import { Drawer, Input, useToast } from '@components/ui';
import { addDays, todayInSaoPaulo } from '@lib/date';
import { useFormSubmit } from '@lib/useFormSubmit';
import { timeOffApi, timeOffQuery, type ScheduleWarning, type TimeOffBody } from './schedule-api';
import { REASON_MAX, timeOffSchema, toTimeOffBody, type TimeOffValues } from './time-off-schema';

const DAYS_AHEAD = 365;

interface TimeOffFormProps {
  loading: boolean;
  onSubmit: (body: TimeOffBody) => Promise<void>;
  onClose: () => void;
}

function TimeOffForm({ loading, onSubmit, onClose }: TimeOffFormProps) {
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
  const submit = handleSubmit((values) => run(() => onSubmit(toTimeOffBody(values))));

  return (
    <FormShell
      onSubmit={submit}
      alert={alert}
      submitting={loading || isSubmitting}
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

export interface TimeOffDrawerProps {
  open: boolean;
  fallbackFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
  onCreated: (date: string, warnings: ScheduleWarning[]) => void;
}

export function TimeOffDrawer({ open, fallbackFocus, onClose, onCreated }: TimeOffDrawerProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const create = async (body: TimeOffBody) => {
    setSubmitting(true);
    try {
      const { warnings } = await timeOffApi.create(body);
      await queryClient.invalidateQueries({ queryKey: timeOffQuery.queryKey });
      onCreated(body.date, warnings);
      onClose();
      show({ message: 'Data bloqueada.', tone: 'success' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Bloquear uma data"
      dismissible={!submitting}
      fallbackFocus={fallbackFocus}
    >
      {open && <TimeOffForm loading={submitting} onSubmit={create} onClose={onClose} />}
    </Drawer>
  );
}
