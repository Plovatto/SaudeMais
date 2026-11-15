import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { LuLock } from 'react-icons/lu';
import { useParams } from 'react-router';
import { z } from 'zod';
import { RESCHEDULE_CLOSED_NOTE, rescheduleBlockedNotes } from '@components/bookings/reschedule-text';
import { FormAlert, Input, QueryError, Skeleton, TextLink } from '@components/ui';
import { areas } from '@constants/areas';
import { ApiError } from '@lib/api/api-error';
import type { PatientBooking } from '@lib/api/models';
import { civilDateInSaoPaulo, formatDateTime } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import type { AvailableDay } from './availability';
import { BookingForm, SlotFields } from './BookingForm';
import { BookingPage } from './BookingPage';
import { emptySlot, slotShape } from './slot-schema';
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
        <TextLink to={`${areas.patient.base}/agendamentos`} className="text-current">
          Voltar para meus agendamentos
        </TextLink>
      </span>
    </FormAlert>
  );
}

interface Reschedulable {
  id: string;
  startsAt: string;
  actions: Pick<PatientBooking['actions'], 'canReschedule' | 'rescheduleBlockedReason'> | null;
}

interface LockedField {
  label: string;
  value: string;
  hint?: string | undefined;
}

interface RescheduleFormProps<B extends Reschedulable> {
  formLabel: string;
  notice?: (booking: B) => string;
  emptyNote: string;
  stacked?: boolean;
  locked: (booking: B) => LockedField[];
  availability: (booking: B) => {
    queryKey: QueryKey;
    load: (signal: AbortSignal) => Promise<AvailableDay[]>;
  };
  reschedule: (booking: B, newStartsAt: string) => Promise<B>;
}

interface ReschedulePageProps<B extends Reschedulable> extends RescheduleFormProps<B> {
  kind: PatientBooking['kind'];
  title: string;
  subtitle: string;
  icon: ReactNode;
  bookedTitle: string;
  describe: (booking: B) => string;
  load: (id: string, signal: AbortSignal) => Promise<B>;
}

function RescheduleForm<B extends Reschedulable>({
  current,
  formLabel,
  notice,
  emptyNote,
  stacked,
  locked,
  availability,
  reschedule,
  onBooked,
}: RescheduleFormProps<B> & { current: B; onBooked: (booking: B) => void }) {
  const queryClient = useQueryClient();
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
      load: async (signal) =>
        (await source.load(signal)).filter((day) =>
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

  useEffect(() => {
    if (preselected.current || days.length === 0) return;
    preselected.current = true;
    if (days.some((day) => day.date === currentDay)) form.setValue('date', currentDay);
  }, [days, currentDay, form]);

  if (closed) return <ClosedNote message={closed} alert />;

  return (
    <BookingForm label={formLabel} booking={booking} submitLabel="Reagendar">
      {locked(current).map(({ label, value, hint }) => (
        <Input key={label} label={label} value={value} hint={hint} icon={<LuLock />} readOnly />
      ))}
      <Input label="Horário atual" value={formatDateTime(current.startsAt)} icon={<LuLock />} readOnly />
      <SlotFields booking={booking} current={current.startsAt} stacked={stacked} emptyNote={emptyNote} />
      {notice && (
        <FormAlert tone="warning" role="note">
          {notice(current)}
        </FormAlert>
      )}
    </BookingForm>
  );
}

export function ReschedulePage<B extends Reschedulable>({
  kind,
  title,
  subtitle,
  icon,
  bookedTitle,
  describe,
  load,
  ...form
}: ReschedulePageProps<B>) {
  const id = useParams().id ?? '';
  const detail = useQuery({
    queryKey: queryKeys.patient.booking(kind, id),
    queryFn: ({ signal }) => load(id, signal),
  });
  const actions = detail.data?.actions;
  const blocked = actions?.rescheduleBlockedReason;
  const gone = detail.error instanceof ApiError && detail.error.code === 'NOT_FOUND';

  return (
    <BookingPage<B>
      title={title}
      subtitle={subtitle}
      icon={icon}
      bookedTitle={bookedTitle}
      describe={describe}
    >
      {(onBooked) => (
        <>
          {detail.isPending && (
            <div aria-busy="true" className="flex flex-col gap-5">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-12" />
            </div>
          )}
          {gone && <ClosedNote message={GONE_MESSAGE} />}
          {detail.isError && !gone && (
            <QueryError error={detail.error} onRetry={() => void detail.refetch()} />
          )}
          {detail.data &&
            (actions?.canReschedule ? (
              <RescheduleForm {...form} current={detail.data} onBooked={onBooked} />
            ) : (
              <ClosedNote message={(blocked && rescheduleBlockedNotes[blocked]) ?? RESCHEDULE_CLOSED_NOTE} />
            ))}
        </>
      )}
    </BookingPage>
  );
}
