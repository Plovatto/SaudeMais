import type { ReactNode } from 'react';
import { LuCalendar, LuClock } from 'react-icons/lu';
import { Button, FormAlert, QueryError, Select, Textarea } from '@components/ui';
import { cx } from '@lib/cx';
import { formatDay, formatTime } from '@lib/date';
import { FREE_TEXT_MAX } from '@lib/validation/text';
import type { Slot } from './availability';
import type { BookingFormState } from './useBookingForm';

const FEW_PLACES = 3;

const slotLabel = ({ startsAt, remaining }: Slot) => {
  const time = formatTime(startsAt);
  if (remaining === undefined || remaining > FEW_PLACES) return time;
  return `${time} · ${remaining === 1 ? '1 vaga' : `${remaining} vagas`}`;
};

interface SlotFieldsProps {
  booking: BookingFormState;
  emptyNote: string;
  places?: boolean;
}

export function SlotFields({ booking, emptyNote, places = false }: SlotFieldsProps) {
  const { days, slots, loading, failure, retry, empty, messages } = booking.slots;
  return (
    <>
      <div
        className={cx(
          'grid items-start gap-5',
          places
            ? 'min-[30rem]:grid-cols-2 min-[30rem]:gap-4'
            : 'min-[22rem]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] min-[22rem]:gap-4',
        )}
      >
        <Select
          label="Data"
          placeholder={loading ? 'Carregando…' : 'Escolha'}
          icon={<LuCalendar />}
          compact
          disabled={days.length === 0}
          {...booking.field('date')}
        >
          {days.map((day) => (
            <option key={day.date} value={day.date}>
              {formatDay(day.date)}
            </option>
          ))}
        </Select>
        <Select
          label="Horário"
          placeholder="Escolha"
          icon={<LuClock />}
          compact
          disabled={slots.length === 0}
          {...booking.field('startsAt')}
        >
          {slots.map((slot) => (
            <option key={slot.startsAt} value={slot.startsAt}>
              {slotLabel(slot)}
            </option>
          ))}
        </Select>
      </div>
      {failure && <QueryError error={failure} messages={messages} onRetry={retry} />}
      {empty && (
        <FormAlert tone="warning" role="note">
          {emptyNote}
        </FormAlert>
      )}
    </>
  );
}

export function NotesField({ booking, placeholder }: { booking: BookingFormState; placeholder: string }) {
  return (
    <Textarea
      label="Observações (opcional)"
      placeholder={placeholder}
      rows={2}
      maxLength={FREE_TEXT_MAX}
      {...booking.field('notes')}
    />
  );
}

interface BookingFormProps {
  label: string;
  booking: BookingFormState;
  submitLabel: string;
  children: ReactNode;
}

export function BookingForm({ label, booking, submitLabel, children }: BookingFormProps) {
  return (
    <form
      aria-label={label}
      noValidate
      onSubmit={(event) => void booking.onSubmit(event)}
      className="flex flex-col gap-5"
    >
      {children}
      {booking.banner && <FormAlert>{booking.banner}</FormAlert>}
      <Button type="submit" size="lg" fullWidth loading={booking.submitting} loadingLabel="Enviando pedido">
        {submitLabel}
      </Button>
    </form>
  );
}
