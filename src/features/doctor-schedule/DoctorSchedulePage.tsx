import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { LuSave } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, FormAlert, QueryError, Skeleton, useToast } from '@components/ui';
import { areas } from '@constants/areas';
import { isDemoEmail } from '@constants/demo-accounts';
import { WEEKDAYS } from '@constants/weekdays';
import { handleProtectedAccount } from '@lib/auth/protected-account';
import { useCurrentUser } from '@lib/auth/useSession';
import { formatDateTime } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { DayCard } from './DayCard';
import { applyRangeErrors, firstRangeError } from './range-errors';
import { scheduleApi, type DoctorSchedule, type ScheduleWarning } from './schedule-api';
import { scheduleSchema, toBody, toValues, type ScheduleValues } from './schedule-schema';

const scheduleMessages = {
  NOT_FOUND: 'Esta conta ainda não tem perfil médico. Peça a um administrador para concluir o cadastro.',
} as const;

const dayGrid = 'grid gap-5 lg:grid-cols-2 lg:items-start';

function warningText(warnings: ScheduleWarning[]): string {
  const count =
    warnings.length === 1 ? '1 consulta futura ficou' : `${warnings.length} consultas futuras ficaram`;
  const dates = warnings.map((warning) => formatDateTime(warning.startsAt)).join('; ');
  return `${count} fora das novas faixas: ${dates}. Nada foi cancelado; confira cada uma na sua agenda.`;
}

function ScheduleForm({ schedule, demo }: { schedule: DoctorSchedule; demo: boolean }) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const [locked, setLocked] = useState(demo);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);
  const schema = useMemo(() => scheduleSchema(schedule.unitHours), [schedule.unitHours]);
  const form = useForm<ScheduleValues>({ resolver: zodResolver(schema), defaultValues: toValues(schedule) });
  const { setError, setFocus, reset } = form;
  const { alert, run } = useFormSubmit(
    setError,
    [],
    (error) =>
      handleProtectedAccount(() => setLocked(true), reset)(error) ||
      applyRangeErrors(error, setError, setFocus),
  );
  const onSubmit = form.handleSubmit(
    (values) =>
      run(async () => {
        setWarnings([]);
        const { warnings: outside, ...saved } = await scheduleApi.save(toBody(values));
        queryClient.setQueryData(queryKeys.doctorSchedule, saved);
        reset(toValues(saved));
        setWarnings(outside);
        show({ message: 'Agenda salva.', tone: 'success' });
      }),
    (errors) => {
      const path = firstRangeError(errors);
      if (path) setFocus(`${path}.startMin`);
    },
  );

  return (
    <form
      aria-label="Agenda semanal"
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-col gap-6"
    >
      {locked && (
        <FormAlert tone="warning" role="note">
          Esta é uma conta de demonstração, compartilhada com outros visitantes. A agenda pode ser vista, mas
          não alterada.
        </FormAlert>
      )}
      <fieldset disabled={locked} className="min-w-0">
        <legend className="sr-only">Dias da semana</legend>
        <div className={dayGrid}>
          {WEEKDAYS.map((name, weekday) => (
            <DayCard
              key={name}
              form={form}
              weekday={weekday}
              unit={schedule.unitHours.find((hours) => hours.weekday === weekday)}
            />
          ))}
        </div>
      </fieldset>
      {warnings.length > 0 && <FormAlert tone="warning">{warningText(warnings)}</FormAlert>}
      {alert && <FormAlert>{alert}</FormAlert>}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          icon={<LuSave />}
          disabled={locked}
          loading={form.formState.isSubmitting}
          loadingLabel="Salvando"
          className="w-full lg:w-auto"
        >
          Salvar agenda
        </Button>
      </div>
    </form>
  );
}

export function DoctorSchedulePage() {
  const user = useCurrentUser();
  const schedule = useQuery({
    queryKey: queryKeys.doctorSchedule,
    queryFn: ({ signal }) => scheduleApi.get(signal),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  return (
    <>
      <PageHeader title="Gerenciar agenda" back backFallback={areas.doctor.base} />
      {schedule.isPending && (
        <div className={dayGrid} aria-busy>
          {WEEKDAYS.map((name) => (
            <Skeleton key={name} className="rounded-card h-36" />
          ))}
        </div>
      )}
      {schedule.isError && (
        <QueryError
          error={schedule.error}
          messages={scheduleMessages}
          onRetry={() => void schedule.refetch()}
        />
      )}
      {schedule.data && <ScheduleForm schedule={schedule.data} demo={isDemoEmail(user.email)} />}
    </>
  );
}
