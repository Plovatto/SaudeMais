import { useId, type ReactNode } from 'react';
import { LuCalendar, LuCheck } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import {
  Button,
  FieldError,
  FormAlert,
  InfoList,
  QueryError,
  SectionCard,
  Skeleton,
  Textarea,
  type InfoItem,
} from '@components/ui';
import { tile } from '@components/ui/styles';
import { DESKTOP_QUERY, useMediaQuery } from '@hooks/useMediaQuery';
import { FREE_TEXT_MAX } from '@lib/validation/text';
import { MonthCalendar } from './MonthCalendar';
import { SlotPicker } from './SlotPicker';
import type { BookingFormState } from './useBookingForm';

interface WhenCardProps {
  booking: BookingFormState;
  emptyNote: string;
  waitingNote?: string | undefined;
  title?: string;
  description?: string | undefined;
  current?: string | undefined;
}

export function WhenCard({
  booking,
  emptyNote,
  waitingNote,
  title = 'Data e horário',
  description,
  current,
}: WhenCardProps) {
  const { days, slots, loading, failure, retry, empty, messages } = booking.slots;
  const error = booking.errors.date ?? booking.errors.startsAt;
  const errorId = useId();
  return (
    <SectionCard title={title} description={description} flush>
      {waitingNote && days.length === 0 && !loading && !failure && !empty ? (
        <p className="text-text-muted px-4 py-6 text-center text-[0.8125rem] lg:px-5">{waitingNote}</p>
      ) : loading ? (
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:p-5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : failure ? (
        <div className="p-4 lg:p-5">
          <QueryError error={failure} messages={messages} onRetry={retry} />
        </div>
      ) : empty ? (
        <div className="p-4 lg:p-5">
          <FormAlert tone="warning" role="note">
            {emptyNote}
          </FormAlert>
        </div>
      ) : (
        <div className="grid md:grid-cols-2">
          <div className="p-4 lg:p-5">
            <MonthCalendar
              available={days.map((day) => day.date)}
              selected={booking.date}
              onSelect={booking.pickDate}
              focusRef={booking.focusRef('date')}
              describedBy={booking.errors.date ? errorId : undefined}
            />
          </div>
          <div className="border-border border-t p-4 md:border-s md:border-t-0 lg:p-5">
            {booking.date ? (
              <SlotPicker
                key={booking.date}
                date={booking.date}
                slots={slots}
                value={booking.startsAt}
                onPick={booking.pickSlot}
                current={current}
                focusRef={booking.focusRef('startsAt')}
                describedBy={booking.errors.startsAt ? errorId : undefined}
              />
            ) : (
              <p
                ref={booking.focusRef('startsAt')}
                tabIndex={-1}
                className="text-text-muted text-[0.8125rem] focus-visible:outline-none"
              >
                Escolha um dia com horários livres no calendário.
              </p>
            )}
          </div>
          {error && (
            <div className="px-4 pb-4 md:col-span-2 lg:px-5">
              <FieldError id={errorId}>{error}</FieldError>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function NotesCard({ booking, placeholder }: { booking: BookingFormState; placeholder: string }) {
  return (
    <SectionCard title="Observação (opcional)">
      <Textarea
        label="Observação"
        labelHidden
        placeholder={placeholder}
        rows={3}
        maxLength={FREE_TEXT_MAX}
        {...booking.field('notes')}
      />
    </SectionCard>
  );
}

export interface BookingSummary {
  title: string;
  items: InfoItem[];
  line: string | null;
  sub: string;
  note: string;
}

interface BookingFormProps {
  label: string;
  heading: { title: string; subtitle: string };
  booking: BookingFormState;
  submitLabel: string;
  shortLabel: string;
  summary: BookingSummary;
  children: ReactNode;
}

export function BookingForm({
  label,
  heading,
  booking,
  submitLabel,
  shortLabel,
  summary,
  children,
}: BookingFormProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const submit = (text: string, className?: string) => (
    <Button
      type="submit"
      size="lg"
      icon={<LuCheck />}
      loading={booking.submitting}
      loadingLabel="Enviando pedido"
      className={className}
    >
      {text}
    </Button>
  );
  return (
    <>
      <PageHeader title={heading.title} subtitle={heading.subtitle} />
      <form
        aria-label={label}
        noValidate
        onSubmit={(event) => void booking.onSubmit(event)}
        className="@container"
      >
        <div className="grid items-start gap-4 lg:gap-5 @min-[880px]:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            {children}
            {booking.banner && <FormAlert>{booking.banner}</FormAlert>}
          </div>
          {desktop ? (
            <SectionCard title={summary.title} raised className="motion-safe:animate-rise sticky top-4">
              <InfoList items={summary.items} />
              <div className="border-border rounded-b-card bg-surface-muted -mx-5 -mb-5 flex flex-col gap-2.5 border-t px-5 pt-4 pb-[18px]">
                {submit(submitLabel, 'w-full')}
                <p className="text-text-muted text-center text-xs">{summary.note}</p>
              </div>
            </SectionCard>
          ) : (
            <div className="border-border bg-surface motion-safe:animate-sheet fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-x-3.5 gap-y-5 rounded-t-[26px] border-t px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-2px_6px_rgb(16_42_41/0.06),0_-22px_44px_-16px_rgb(16_42_41/0.4)] print:hidden">
              <span aria-hidden className={tile}>
                <LuCalendar />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p
                  className={
                    summary.line
                      ? 'text-text text-sm font-semibold tabular-nums'
                      : 'text-text-muted text-sm font-semibold'
                  }
                >
                  {summary.line ?? 'Escolha dia e horário'}
                </p>
                <p className="text-text-secondary truncate text-xs">{summary.sub}</p>
              </div>
              {submit(shortLabel, 'h-14 w-full rounded-[15px] text-base')}
            </div>
          )}
        </div>
      </form>
    </>
  );
}
