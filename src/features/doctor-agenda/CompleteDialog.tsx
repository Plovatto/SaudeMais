import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { isStale } from '@components/bookings/stale-appointment';
import { Button, Dialog, FormAlert, Input } from '@components/ui';
import { useFormSubmit } from '@hooks/useFormSubmit';
import type { DoctorAppointment, HealthMetricsInput } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { optionalNumber } from '@lib/validation/number';

const metricsSchema = z.object({
  metrics: z
    .object({
      systolic: optionalNumber({
        min: 50,
        max: 300,
        format: 'Informe a sistólica em mmHg, sem casas decimais.',
        range: 'A sistólica vai de 50 a 300 mmHg.',
      }),
      diastolic: optionalNumber({
        min: 30,
        max: 200,
        format: 'Informe a diastólica em mmHg, sem casas decimais.',
        range: 'A diastólica vai de 30 a 200 mmHg.',
      }),
      weightKg: optionalNumber({
        min: 1,
        max: 500,
        decimals: 2,
        format: 'Informe o peso em kg.',
        precision: 'Informe o peso com no máximo duas casas decimais.',
        range: 'O peso vai de 1 a 500 kg.',
      }),
    })
    .superRefine(
      ({ systolic, diastolic }, ctx) => {
        if (systolic === undefined && diastolic !== undefined)
          ctx.addIssue({
            code: 'custom',
            path: ['systolic'],
            message: 'Informe a sistólica junto com a diastólica.',
          });
        else if (systolic !== undefined && diastolic === undefined)
          ctx.addIssue({
            code: 'custom',
            path: ['diastolic'],
            message: 'Informe a diastólica junto com a sistólica.',
          });
        else if (typeof systolic === 'number' && typeof diastolic === 'number' && systolic <= diastolic)
          ctx.addIssue({
            code: 'custom',
            path: ['systolic'],
            message: 'A sistólica precisa ser maior que a diastólica.',
          });
      },
      { when: () => true },
    )
    .transform(({ systolic, diastolic, weightKg }): HealthMetricsInput | undefined => {
      const metrics = {
        ...(systolic !== undefined && diastolic !== undefined && { systolic, diastolic }),
        ...(weightKg !== undefined && { weightKg }),
      };
      return Object.keys(metrics).length > 0 ? metrics : undefined;
    }),
});

type MetricsValues = z.input<typeof metricsSchema>;

const FIELDS = ['metrics.systolic', 'metrics.diastolic', 'metrics.weightKg'] as const;

interface CompleteFormProps {
  loading: boolean;
  onSubmit: (metrics: HealthMetricsInput | undefined) => Promise<void>;
  onClose: () => void;
}

function CompleteForm({
  loading,
  onSubmit,
  onClose,
  firstFieldRef,
}: CompleteFormProps & { firstFieldRef: RefObject<HTMLInputElement | null> }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MetricsValues, unknown, z.output<typeof metricsSchema>>({
    resolver: zodResolver(metricsSchema),
    defaultValues: { metrics: { systolic: '', diastolic: '', weightKg: '' } },
  });
  const { alert, run } = useFormSubmit(setError, FIELDS, (error) => {
    if (!isStale(error)) return false;
    onClose();
    return true;
  });
  const submit = handleSubmit(({ metrics }) => run(() => onSubmit(metrics)));
  const pressure = { inputMode: 'numeric', autoComplete: 'off' } as const;
  const systolic = register('metrics.systolic');

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <fieldset disabled={loading} className="flex min-w-0 flex-col gap-4">
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="text-text mb-3 text-[0.9375rem] font-semibold">Pressão arterial</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sistólica (mmHg)"
              error={errors.metrics?.systolic?.message}
              {...pressure}
              {...systolic}
              ref={(element) => {
                systolic.ref(element);
                firstFieldRef.current = element;
              }}
            />
            <Input
              label="Diastólica (mmHg)"
              error={errors.metrics?.diastolic?.message}
              {...pressure}
              {...register('metrics.diastolic')}
            />
          </div>
        </fieldset>
        <Input
          label="Peso (kg)"
          hint="Use vírgula para os decimais, como em 72,4."
          inputMode="decimal"
          autoComplete="off"
          error={errors.metrics?.weightKg?.message}
          {...register('metrics.weightKg')}
        />
      </fieldset>
      {alert && <FormAlert>{alert}</FormAlert>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" disabled={loading} onClick={onClose}>
          Voltar
        </Button>
        <Button type="submit" loading={loading} loadingLabel="Concluindo">
          Concluir consulta
        </Button>
      </div>
    </form>
  );
}

export interface CompleteDialogProps extends CompleteFormProps {
  appointment: DoctorAppointment | null;
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function CompleteDialog({
  appointment,
  loading,
  onSubmit,
  onClose,
  fallbackFocus,
}: CompleteDialogProps) {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      open={appointment !== null}
      onClose={onClose}
      title="Concluir consulta"
      description={
        appointment &&
        `${appointment.patient.fullName}, ${formatDateTime(appointment.startsAt)}. Registre a pressão e o peso medidos na consulta, se houver; os campos são opcionais.`
      }
      dismissible={!loading}
      initialFocus={firstFieldRef}
      fallbackFocus={fallbackFocus}
    >
      {appointment && (
        <CompleteForm
          key={appointment.id}
          loading={loading}
          onSubmit={onSubmit}
          onClose={onClose}
          firstFieldRef={firstFieldRef}
        />
      )}
    </Dialog>
  );
}
