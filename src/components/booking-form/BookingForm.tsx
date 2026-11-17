import { useId, type ReactNode } from 'react';
import { LuCalendar, LuCheck } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import {
  Button,
  FieldError,
  FormAlert,
  ListMessage,
  QueryError,
  SectionCard,
  Skeleton,
  Textarea,
} from '@components/ui';
import { footerBar, sectionPad, tile } from '@components/ui/styles';
import { cx } from '@lib/cx';
import { DESKTOP_QUERY, useMediaQuery } from '@hooks/useMediaQuery';
import { FREE_TEXT_MAX } from '@lib/validation/text';
import { MonthCalendar } from './MonthCalendar';
import { SlotPicker } from './SlotPicker';
import type { BookingFormState } from './useBookingForm';

const whenGrid = 'grid @min-[520px]:grid-cols-[300px_minmax(0,1fr)]';

export const fieldGrid = 'grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4';

interface WhenCardProps {
  booking: BookingFormState;
  emptyNote: string;
  waitingNote?: string | undefined;
  title?: string;
  hint?: string | undefined;
  current?: string | undefined;
}

export function WhenCard({
  booking,
  emptyNote,
  waitingNote,
  title = 'Data e horário',
  hint,
  current,
}: WhenCardProps) {
  const { days, slots, loading, failure, retry, empty, messages } = booking.slots;
  const error = booking.errors.date ?? booking.errors.startsAt;
  const errorId = useId();
  return (
    <SectionCard
      title={title}
      className="@container"
      flush
      action={hint && <span className="text-text-muted text-[0.8125rem] max-lg:basis-full">{hint}</span>}
    >
      {waitingNote && days.length === 0 && !loading && !failure && !empty ? (
        <ListMessage>{waitingNote}</ListMessage>
      ) : loading ? (
        <div className={cx(whenGrid, 'gap-4', sectionPad)}>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : failure ? (
        <QueryError padded error={failure} messages={messages} onRetry={retry} />
      ) : empty ? (
        <div className={sectionPad}>
          <FormAlert tone="warning" role="note">
            {emptyNote}
          </FormAlert>
        </div>
      ) : (
        <div className={whenGrid}>
          <div className={cx('min-w-0', sectionPad)}>
            <MonthCalendar
              available={days.map((day) => day.date)}
              selected={booking.date}
              onSelect={booking.pickDate}
              focusRef={booking.focusRef('date')}
              describedBy={booking.errors.date ? errorId : undefined}
            />
          </div>
          <div className="border-border min-w-0 border-t p-4 lg:p-5 @min-[520px]:border-s @min-[520px]:border-t-0">
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
            <div className="px-4 pb-4 lg:px-5 @min-[520px]:col-span-2">
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
  details: ReactNode;
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
  ready?: boolean;
  children: ReactNode;
}

export function BookingForm({
  label,
  heading,
  booking,
  submitLabel,
  shortLabel,
  summary,
  ready = booking.startsAt !== '',
  children,
}: BookingFormProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const submit = (text: string, className: string, icon?: ReactNode) => (
    <Button
      type="submit"
      size="lg"
      icon={icon}
      loading={booking.submitting}
      loadingLabel="Enviando pedido"
      data-ready={ready}
      aria-disabled={!ready || booking.submitting || undefined}
      className={cx('transition-none', className)}
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
        <div className="grid items-start gap-4 lg:gap-5 @min-[900px]:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            {children}
            {booking.banner && <FormAlert>{booking.banner}</FormAlert>}
          </div>
          {desktop ? (
            <SectionCard title={summary.title} raised className="motion-safe:animate-rise sticky top-4">
              {summary.details}
              <div className={cx(footerBar, '-mx-5 -mb-5 flex flex-col gap-2.5 px-5 pt-4 pb-[18px]')}>
                {submit(submitLabel, 'w-full', <LuCheck />)}
                <p className="text-text-muted text-center text-xs">{summary.note}</p>
              </div>
            </SectionCard>
          ) : (
            <div className="border-border bg-surface motion-safe:animate-sheet fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-x-3.5 gap-y-5 rounded-t-[26px] border-t px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-2px_6px_rgb(16_42_41/0.06),0_-22px_44px_-16px_rgb(16_42_41/0.4)] print:hidden">
              <span aria-hidden className={cx(tile, 'size-12 rounded-[14px] [&_svg]:size-[22px]')}>
                <LuCalendar />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p
                  className={cx(
                    'truncate text-[1.09375rem] font-bold tabular-nums',
                    summary.line ? 'text-text' : 'text-text-muted',
                  )}
                >
                  {summary.line ?? 'Escolha dia e horário'}
                </p>
                <p className="text-text-secondary truncate text-[0.84375rem]">{summary.sub}</p>
              </div>
              {submit(
                shortLabel,
                'h-[54px] w-full rounded-[15px] text-base font-bold data-[ready=false]:border-transparent data-[ready=false]:bg-surface-strong data-[ready=false]:text-text-secondary data-[ready=false]:opacity-100',
              )}
            </div>
          )}
        </div>
      </form>
    </>
  );
}
