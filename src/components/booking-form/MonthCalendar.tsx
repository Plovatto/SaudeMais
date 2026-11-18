import { useState, type Ref } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { IconButton } from '@components/ui';
import { WEEKDAYS } from '@constants/weekdays';
import { cx } from '@lib/cx';
import { addDays, formatLongDay, formatMonth, middayOf, todayInSaoPaulo, weekdayOf } from '@lib/date';

const WEEKDAY_NAMES = WEEKDAYS.map((weekday) => weekday.split('-')[0]?.toLowerCase() ?? weekday);

const monthOf = (date: string) => date.slice(0, 7);

function shiftMonth(month: string, step: number): string {
  const [year = 0, index = 1] = month.split('-').map(Number);
  const value = new Date(Date.UTC(year, index - 1 + step, 1));
  return value.toISOString().slice(0, 7);
}

function cellsOf(month: string): string[] {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayOf(first));
  const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  return monthOf(cells[35] ?? '') === month ? cells : cells.slice(0, 35);
}

export interface MonthCalendarProps {
  available: readonly string[];
  selected: string;
  onSelect: (date: string) => void;
  focusRef?: Ref<HTMLDivElement>;
  describedBy?: string | undefined;
}

export function MonthCalendar({ available, selected, onSelect, focusRef, describedBy }: MonthCalendarProps) {
  const today = todayInSaoPaulo();
  const open = new Set(available);
  const first = monthOf(available[0] ?? today);
  const last = monthOf(available.at(-1) ?? today);
  const [shown, setShown] = useState(monthOf(selected || available[0] || today));
  const [followed, setFollowed] = useState(selected);
  if (selected !== followed) {
    setFollowed(selected);
    if (selected) setShown(monthOf(selected));
  }
  const month = shown < first ? first : shown > last ? last : shown;

  return (
    <div
      ref={focusRef}
      tabIndex={-1}
      role="group"
      aria-label="Calendário"
      aria-describedby={describedBy}
      className="flex flex-col gap-3 focus-visible:outline-none"
    >
      <div className="flex items-center gap-2">
        <p aria-live="polite" className="text-text flex-1 text-sm font-semibold">
          {formatMonth(middayOf(`${month}-01`))}
        </p>
        <IconButton
          label="Mês anterior"
          icon={<LuChevronLeft />}
          disabled={month <= first}
          onClick={() => setShown(shiftMonth(month, -1))}
          className="border-border-strong bg-surface shadow-button size-9 border lg:size-8"
        />
        <IconButton
          label="Próximo mês"
          icon={<LuChevronRight />}
          disabled={month >= last}
          onClick={() => setShown(shiftMonth(month, 1))}
          className="border-border-strong bg-surface shadow-button size-9 border lg:size-8"
        />
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((weekday, index) => (
          <abbr
            key={WEEKDAY_NAMES[index]}
            title={WEEKDAY_NAMES[index]}
            className="text-text-muted pt-1 pb-1.5 text-[0.6875rem] font-semibold no-underline"
          >
            {weekday[0]}
          </abbr>
        ))}
        {cellsOf(month).map((date) => {
          const outside = monthOf(date) !== month;
          const bookable = !outside && open.has(date);
          const isSelected = date === selected;
          return (
            <button
              key={date}
              type="button"
              disabled={!bookable}
              aria-pressed={bookable ? isSelected : undefined}
              aria-current={date === today ? 'date' : undefined}
              aria-label={`${formatLongDay(middayOf(date))}${bookable ? '' : ', sem horários'}`}
              onClick={() => onSelect(date)}
              className={cx(
                'rounded-field relative h-10 text-[0.8125rem] font-medium tabular-nums transition-[background-color,color,scale] duration-150 lg:h-9',
                outside && 'opacity-60',
                bookable &&
                  !isSelected &&
                  'can-hover:bg-surface-strong after:bg-role-strong after:absolute after:bottom-[5px] after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full',
                isSelected && 'bg-role-strong text-on-role motion-safe:animate-pop font-bold',
                !bookable && 'text-text-muted cursor-not-allowed opacity-45',
                date === today &&
                  !isSelected &&
                  'text-role-text font-bold shadow-[inset_0_0_0_1.5px_var(--role-strong)]',
              )}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
