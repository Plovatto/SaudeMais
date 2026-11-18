import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { LuChevronDown, LuLock, LuMapPin, LuTriangleAlert } from 'react-icons/lu';
import { useParams } from 'react-router';
import { z } from 'zod';
import { DateTile } from '@components/bookings/DateTile';
import { RESCHEDULE_CLOSED_NOTE, rescheduleBlockedNotes } from '@components/bookings/reschedule-text';
import { PageHeader } from '@components/layout/PageHeader';
import { FormAlert, InfoList, QueryError, SectionCard, Skeleton, TextLink } from '@components/ui';
import { PATIENT_BOOKINGS_PATH } from '@constants/areas';
import { ApiError } from '@lib/api/api-error';
import type { PatientBooking } from '@lib/api/models';
import { softTones } from '@components/ui/styles';
import { cx } from '@lib/cx';
import { civilDateInSaoPaulo, middayOf, whenText } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import type { AvailableDay, WindowPage } from './availability';
import { BookingForm, WhenCard } from './BookingForm';
import { emptySlot, slotShape } from './slot-schema';
import { useBookedRedirect } from './useBookedRedirect';
import { useBookingForm } from './useBookingForm';

const FIELDS = ['startsAt'] as const;

const rescheduleSchema = z.object(slotShape);

const fieldByCode = { SAME_SLOT: 'startsAt' } as const;

const fieldAliases = { newStartsAt: 'startsAt' } as const;

const POLICY_CODES = new Set(['RESCHEDULE_WINDOW_CLOSED', 'RESCHEDULE_LIMIT', 'INVALID_STATE', 'NOT_FOUND']);

const GONE_MESSAGE = 'Este agendamento não pode mais ser reagendado. Confira a lista atualizada.';

const rescheduleMessages = { NOT_FOUND: GONE_MESSAGE } as const;

function ClosedNote({ message, alert = false }: { message: string; alert?: boolean }) {
  return (
    <FormAlert {...(!alert && ({ tone: 'warning', role: 'note' } as const))}>
      <span>
        {message}{' '}
        <TextLink to={PATIENT_BOOKINGS_PATH} className="text-current">
          Voltar para meus agendamentos
        </TextLink>
      </span>
    </FormAlert>
  );
}

const swapRow =
  'grid grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-3 gap-y-0.5 rounded-[14px] border p-3';

function SwapRow({
  label,
  startsAt,
  text,
  className,
  tileClassName = '',
  textClassName,
  muted = false,
}: {
  label: string;
  startsAt: string;
  text: string;
  className: string;
  tileClassName?: string;
  textClassName: string;
  muted?: boolean;
}) {
  return (
    <div className={cx(swapRow, className)}>
      <dt className="text-text-muted col-start-2 row-start-1 self-end text-xs">{label}</dt>
      <dd aria-hidden className="col-start-1 row-span-2 row-start-1 flex">
        <DateTile key={startsAt} startsAt={startsAt} muted={muted} className={tileClassName} />
      </dd>
      <dd className={cx('col-start-2 self-start text-sm font-semibold tabular-nums', textClassName)}>
        {text}
      </dd>
    </div>
  );
}

function TimeSwap({ current, next, moved }: { current: string; next: string; moved: boolean }) {
  return (
    <dl className="flex flex-col gap-1.5">
      <SwapRow
        label="Atual"
        startsAt={current}
        text={whenText(current)}
        muted
        className="border-border bg-surface-muted"
        textClassName="text-text-muted line-through"
      />
      <div aria-hidden className="relative z-10 -my-3.5 grid place-items-center">
        <span className="border-border bg-surface text-text-muted grid size-7 place-items-center rounded-full border">
          <LuChevronDown className="size-3.5" />
        </span>
      </div>
      <SwapRow
        label="Novo"
        startsAt={next}
        text={moved ? whenText(next) : 'Escolha outro horário'}
        className="border-role-soft-strong bg-[color-mix(in_oklab,var(--role-soft)_45%,var(--surface))]"
        tileClassName={moved ? 'motion-safe:animate-pop' : ''}
        textClassName={moved ? 'text-text' : 'text-text-muted'}
      />
    </dl>
  );
}

interface Reschedulable {
  id: string;
  startsAt: string;
}

export interface LockedDetails {
  icon: ReactNode;
  kindLabel: string;
  title: string;
  subtitle: string;
  unitName: string;
  unitAddress: string;
  changeHint: string;
  calendarHint: string;
}

interface RescheduleFormProps<B extends Reschedulable> {
  formLabel: string;
  notice?: (booking: B) => string;
  emptyNote: string;
  confirmNote: string;
  bookedMessage: string;
  details: (booking: B) => LockedDetails;
  availability: (booking: B) => {
    queryKey: QueryKey;
    load: (signal: AbortSignal, page: WindowPage) => Promise<AvailableDay[]>;
  };
  reschedule: (booking: B, newStartsAt: string) => Promise<B>;
}

interface ReschedulePageProps<B extends Reschedulable> extends RescheduleFormProps<B> {
  kind: PatientBooking['kind'];
  load: (id: string, signal: AbortSignal) => Promise<B>;
  actionsOf: (booking: B) => PatientBooking['actions'] | null;
}

const HEADING = {
  title: 'Reagendar',
  subtitle: 'Escolha uma nova data e horário. O restante continua igual.',
};

function RescheduleForm<B extends Reschedulable>({
  current,
  formLabel,
  notice,
  emptyNote,
  confirmNote,
  bookedMessage,
  details,
  availability,
  reschedule,
}: RescheduleFormProps<B> & { current: B }) {
  const queryClient = useQueryClient();
  const onBooked = useBookedRedirect<B>(() => bookedMessage);
  const [closed, setClosed] = useState<string | null>(null);
  const preselected = useRef(false);
  const close = (message: string) => {
    setClosed(message);
    void queryClient.invalidateQueries({ queryKey: queryKeys.patient.all, refetchType: 'none' });
  };
  const source = availability(current);
  const form = useForm({ resolver: zodResolver(rescheduleSchema), defaultValues: emptySlot });
  const booking = useBookingForm(form, {
    fields: FIELDS,
    availability: {
      queryKey: source.queryKey,
      load: async (signal, page) =>
        (await source.load(signal, page)).filter((day) =>
          day.slots.some((slot) => slot.startsAt !== current.startsAt),
        ),
      enabled: true,
    },
    fieldByCode,
    fieldAliases,
    messages: rescheduleMessages,
    onNotFound: () => close(GONE_MESSAGE),
    book: ({ startsAt }) =>
      reschedule(current, startsAt).catch((error: unknown) => {
        if (error instanceof ApiError && POLICY_CODES.has(error.code)) {
          close(errorMessage(error, rescheduleMessages));
        }
        throw error;
      }),
    onBooked,
  });
  const { days } = booking.slots;
  const currentDay = civilDateInSaoPaulo(new Date(current.startsAt));
  const locked = details(current);
  const moved = booking.startsAt !== '' && booking.startsAt !== current.startsAt;

  useEffect(() => {
    if (preselected.current || days.length === 0) return;
    preselected.current = true;
    if (days.some((day) => day.date === currentDay)) form.setValue('date', currentDay);
  }, [days, currentDay, form]);

  if (closed) {
    return (
      <>
        <PageHeader {...HEADING} />
        <ClosedNote message={closed} alert />
      </>
    );
  }

  return (
    <BookingForm
      label={formLabel}
      heading={HEADING}
      booking={booking}
      ready={moved}
      submitLabel="Confirmar novo horário"
      shortLabel="Confirmar"
      summary={{
        title: 'Mudança de horário',
        line: moved ? whenText(booking.startsAt) : null,
        sub: `Antes: ${whenText(current.startsAt)}`,
        note: confirmNote,
        details: (
          <TimeSwap
            current={current.startsAt}
            next={moved ? booking.startsAt : booking.date ? middayOf(booking.date) : current.startsAt}
            moved={moved}
          />
        ),
      }}
    >
      <SectionCard
        title="Seu agendamento"
        action={
          <span
            className={cx(
              softTones.neutral,
              'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold',
            )}
          >
            <LuLock aria-hidden className="size-3" />
            Não muda
          </span>
        }
      >
        <InfoList
          items={[
            {
              key: 'what',
              icon: locked.icon,
              label: locked.kindLabel,
              value: locked.title,
              hint: locked.subtitle,
            },
            {
              key: 'unit',
              icon: <LuMapPin />,
              label: 'Local',
              value: locked.unitName,
              hint: locked.unitAddress,
            },
          ]}
        />
        <p className="text-text-muted text-xs">{locked.changeHint}</p>
      </SectionCard>
      <WhenCard
        booking={booking}
        title="Nova data e horário"
        hint={locked.calendarHint}
        current={current.startsAt}
        emptyNote={emptyNote}
      />
      {notice && (
        <p role="note" className="text-warning-text flex items-start gap-2 px-1 text-[0.8125rem]">
          <LuTriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {notice(current)}
        </p>
      )}
    </BookingForm>
  );
}

export function ReschedulePage<B extends Reschedulable>({
  kind,
  load,
  actionsOf,
  ...form
}: ReschedulePageProps<B>) {
  const id = useParams().id ?? '';
  const detail = useQuery({
    queryKey: queryKeys.patient.booking(kind, id),
    queryFn: ({ signal }) => load(id, signal),
  });
  const actions = detail.data && actionsOf(detail.data);
  const blocked = actions?.rescheduleBlockedReason;
  const gone = detail.error instanceof ApiError && detail.error.code === 'NOT_FOUND';

  if (detail.data && actions?.canReschedule) return <RescheduleForm {...form} current={detail.data} />;

  return (
    <>
      <PageHeader {...HEADING} />
      {detail.isPending && (
        <div aria-busy="true" className="flex flex-col gap-4">
          <Skeleton className="rounded-card h-40" />
          <Skeleton className="rounded-card h-72" />
        </div>
      )}
      {gone && <ClosedNote message={GONE_MESSAGE} />}
      {detail.isError && !gone && <QueryError error={detail.error} onRetry={() => void detail.refetch()} />}
      {detail.data && (
        <ClosedNote message={(blocked && rescheduleBlockedNotes[blocked]) ?? RESCHEDULE_CLOSED_NOTE} />
      )}
    </>
  );
}
