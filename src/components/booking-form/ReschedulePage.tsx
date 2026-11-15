import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { LuLock } from 'react-icons/lu';
import { useParams } from 'react-router';
import { z } from 'zod';
import { RESCHEDULE_CLOSED_NOTE, rescheduleBlockedNotes } from '@components/bookings/reschedule-text';
import { FormAlert, Input, QueryError, Skeleton, TextLink } from '@components/ui';
import { areas } from '@constants/areas';
import { ApiError } from '@lib/api/api-error';
import type { PatientBooking } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import type { AvailableDay } from './availability';
import { BookingForm, SlotFields } from './BookingForm';
import { BookingPage } from './BookingPage';
import { emptySlot, slotShape } from './slot-schema';
import { useBookingForm } from './useBookingForm';

const FIELDS = ['startsAt'] as const;

const rescheduleSchema = z.object(slotShape);

const fieldByCode = { SAME_SLOT: 'startsAt' } as const;

const POLICY_CODES = new Set(['RESCHEDULE_WINDOW_CLOSED', 'RESCHEDULE_LIMIT', 'INVALID_STATE']);

const rescheduleMessages = {
  NOT_FOUND: 'Este agendamento não pode mais ser reagendado. Confira a lista atualizada.',
} as const;

const backToList = (
  <TextLink to={`${areas.patient.base}/agendamentos`} className="text-current">
    Voltar para meus agendamentos
  </TextLink>
);

interface Reschedulable {
  id: string;
  startsAt: string;
  actions: Pick<PatientBooking['actions'], 'canReschedule' | 'rescheduleBlockedReason'> | null;
}

export interface LockedField {
  label: string;
  value: string;
  hint?: string | undefined;
}

interface RescheduleFormProps<B extends Reschedulable> {
  formLabel: string;
  notice?: string;
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
  const [closed, setClosed] = useState(false);
  const close = () => {
    setClosed(true);
    void queryClient.invalidateQueries({ queryKey: queryKeys.patient.all, refetchType: 'none' });
  };
  const form = useForm({ resolver: zodResolver(rescheduleSchema), defaultValues: emptySlot });
  const booking = useBookingForm(form, {
    fields: FIELDS,
    availability: { ...availability(current), enabled: true },
    fieldByCode,
    messages: rescheduleMessages,
    onNotFound: close,
    book: ({ startsAt }) =>
      reschedule(current, startsAt).catch((error: unknown) => {
        if (error instanceof ApiError && POLICY_CODES.has(error.code)) close();
        throw error;
      }),
    onBooked,
  });

  return (
    <BookingForm
      label={formLabel}
      booking={booking}
      submitLabel="Reagendar"
      alertAction={closed && backToList}
    >
      {locked(current).map(({ label, value, hint }) => (
        <Input key={label} label={label} value={value} hint={hint} icon={<LuLock />} readOnly />
      ))}
      <Input label="Horário atual" value={formatDateTime(current.startsAt)} icon={<LuLock />} readOnly />
      <SlotFields booking={booking} current={current.startsAt} stacked={stacked} emptyNote={emptyNote} />
      {notice && (
        <FormAlert tone="warning" role="note">
          {notice}
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
          {detail.isError && (
            <QueryError
              error={detail.error}
              messages={rescheduleMessages}
              onRetry={() => void detail.refetch()}
            />
          )}
          {detail.data &&
            (actions?.canReschedule ? (
              <RescheduleForm {...form} current={detail.data} onBooked={onBooked} />
            ) : (
              <FormAlert tone="warning" role="note">
                <span>
                  {(blocked && rescheduleBlockedNotes[blocked]) ?? RESCHEDULE_CLOSED_NOTE} {backToList}
                </span>
              </FormAlert>
            ))}
        </>
      )}
    </BookingPage>
  );
}
