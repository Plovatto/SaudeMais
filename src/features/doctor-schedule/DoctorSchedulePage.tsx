import { zodResolver } from '@hookform/resolvers/zod';
import { usePrefetchQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { LuCheck, LuClock } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import {
  Button,
  CtaBar,
  ctaButton,
  FormAlert,
  QueryError,
  Skeleton,
  stagger,
  useToast,
} from '@components/ui';
import { areas } from '@constants/areas';
import { DESKTOP_QUERY, useMediaQuery } from '@hooks/useMediaQuery';
import { cx } from '@lib/cx';
import { plural } from '@lib/plural';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@hooks/useFormSubmit';
import { DayCard } from './DayCard';
import { DurationCard } from './DurationCard';
import { applyRangeErrors, rangeErrorPaths, weekdayOf, type RangePath } from './range-errors';
import { scheduleApi, timeOffQuery, type DoctorSchedule, type ScheduleWarning } from './schedule-api';
import { DAY_ORDER, scheduleSchema, toBody, toValues, unitFor, type ScheduleValues } from './schedule-schema';
import { useTimeOff } from './useTimeOff';
import { useWeeklySlots } from './useWeeklySlots';
import { WarningAlert } from './WarningAlert';

const SCHEDULE_FORM_ID = 'doctor-schedule-form';

const scheduleMessages = {
  NOT_FOUND: 'Esta conta ainda não tem perfil médico. Peça a um administrador para concluir o cadastro.',
} as const;

const layout = 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5';

const savedMessage = (outside: number) =>
  outside === 0
    ? 'Horários salvos.'
    : `Horários salvos. ${plural(outside, 'consulta ficou', 'consultas ficaram')} fora dos períodos.`;

const column = 'flex min-w-0 flex-col gap-3.5';

function ScheduleHeader({ action }: { action?: ReactNode }) {
  return (
    <PageHeader
      title="Horários de atendimento"
      subtitle="Os pacientes só veem horários livres dentro destes períodos."
      action={action}
      back
      backFallback={areas.doctor.base}
    />
  );
}

function ScheduleForm({ schedule }: { schedule: DoctorSchedule }) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const queryClient = useQueryClient();
  const { show } = useToast();
  const timeOff = useTimeOff();
  const warningRef = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState(schedule);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set());
  const [focusTarget, setFocusTarget] = useState<RangePath>();
  const schema = useMemo(() => scheduleSchema(base.unitHours), [base.unitHours]);
  const values = useMemo(() => toValues(base), [base]);
  const form = useForm<ScheduleValues>({ resolver: zodResolver(schema), values });
  const { control, setError, setFocus, reset, subscribe, trigger } = form;
  const { isDirty, isSubmitting, submitCount } = form.formState;
  if (schedule !== base && !isDirty && !isSubmitting) setBase(schedule);
  const slots = useWeeklySlots(control);

  const setDayExpanded = (weekday: number, open: boolean) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(weekday);
      else next.delete(weekday);
      return next;
    });

  const focusRanges = (paths: RangePath[]) => {
    setFocusTarget(paths[0]);
    setExpanded((current) => new Set([...current, ...paths.map(weekdayOf)]));
    return paths.length > 0;
  };

  const { alert, run } = useFormSubmit(setError, [], (error) =>
    focusRanges(applyRangeErrors(error, setError)),
  );

  const onSubmit = form.handleSubmit(
    (values) =>
      run(async () => {
        setWarnings([]);
        const { warnings: outside, ...saved } = await scheduleApi.save(toBody(values, base));
        const active = document.activeElement;
        if (active instanceof HTMLButtonElement && active.form?.id === SCHEDULE_FORM_ID) active.form.focus();
        queryClient.setQueryData(queryKeys.doctorSchedule, saved);
        setBase(saved);
        reset(toValues(saved));
        setWarnings(outside);
        show({ message: savedMessage(outside.length), tone: outside.length > 0 ? 'info' : 'success' });
      }),
    (errors) => focusRanges(rangeErrorPaths(errors)),
  );

  useEffect(() => {
    if (!isSubmitting && focusTarget) setFocus(`${focusTarget}.startMin`);
  }, [focusTarget, isSubmitting, setFocus]);

  useEffect(() => {
    if (warnings.length > 0) warningRef.current?.scrollIntoView({ block: 'center' });
  }, [warnings]);

  useEffect(() => {
    if (submitCount === 0) return;
    return subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        const weekday = /^days\.(\d+)/.exec(name ?? '')?.[1];
        if (weekday !== undefined) void trigger(`days.${Number(weekday)}.ranges`);
      },
    });
  }, [submitCount, subscribe, trigger]);

  const save = (label: string, className?: string) => (
    <Button
      type="submit"
      form={SCHEDULE_FORM_ID}
      icon={<LuCheck />}
      loading={isSubmitting}
      loadingLabel="Salvando"
      className={className}
    >
      {label}
    </Button>
  );

  return (
    <>
      <ScheduleHeader action={desktop && isDirty && save('Salvar horários')} />
      <form
        id={SCHEDULE_FORM_ID}
        tabIndex={-1}
        aria-label="Horários de atendimento"
        noValidate
        onSubmit={(event) => {
          setFocusTarget(undefined);
          void onSubmit(event);
        }}
        className="flex flex-col gap-4 outline-none lg:gap-5"
      >
        <WarningAlert
          ref={warningRef}
          warnings={warnings}
          one="consulta futura ficou fora dos novos períodos"
          many="consultas futuras ficaram fora dos novos períodos"
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <fieldset disabled={isSubmitting} className={cx(layout, 'min-w-0 lg:items-stretch')}>
          <legend className="sr-only">Dias e consultas</legend>
          <div className={cx(column, stagger(0))}>
            {DAY_ORDER.map((weekday) => (
              <DayCard
                key={weekday}
                form={form}
                weekday={weekday}
                unit={unitFor(base.unitHours, weekday)}
                expanded={expanded.has(weekday)}
                onExpandedChange={(open) => setDayExpanded(weekday, open)}
              />
            ))}
          </div>
          <div className={cx('flex min-w-0 flex-col gap-4 lg:gap-5', stagger(1))}>
            <DurationCard control={control} schedule={base} slots={slots} />
            {timeOff.card}
          </div>
        </fieldset>
      </form>
      {timeOff.drawer}
      {!desktop && isDirty && (
        <CtaBar
          aboveNav
          icon={<LuClock />}
          title="Seus horários"
          sub={`${plural(slots, 'horário', 'horários')} por semana`}
        >
          {save('Salvar', ctaButton)}
        </CtaBar>
      )}
    </>
  );
}

export function DoctorSchedulePage() {
  usePrefetchQuery(timeOffQuery);
  const schedule = useQuery({
    queryKey: queryKeys.doctorSchedule,
    queryFn: ({ signal }) => scheduleApi.get(signal),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  if (schedule.data) return <ScheduleForm schedule={schedule.data} />;
  return (
    <>
      <ScheduleHeader />
      {schedule.isPending && (
        <div className={layout} aria-busy>
          <span className="sr-only">Carregando horários</span>
          <div className={column}>
            {DAY_ORDER.map((weekday) => (
              <Skeleton key={weekday} className="rounded-card h-[74px]" />
            ))}
          </div>
          <Skeleton className="rounded-card h-48" />
        </div>
      )}
      {schedule.isError && (
        <QueryError
          error={schedule.error}
          messages={scheduleMessages}
          onRetry={() => void schedule.refetch()}
        />
      )}
    </>
  );
}
