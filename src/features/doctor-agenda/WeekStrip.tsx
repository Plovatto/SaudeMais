import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Button, IconButton } from '@components/ui';
import { cx } from '@lib/cx';
import { dayTile, formatLongDay, formatMonth, middayOf } from '@lib/date';
import { plural } from '@lib/plural';

const stepButton = 'border-border-strong can-hover:bg-surface-muted border';

export interface WeekStripProps {
  days: readonly string[];
  selected: string;
  today: string;
  countOf: (day: string) => number | undefined;
  onSelect: (day: string) => void;
  onStep: (weeks: number) => void;
  onToday: () => void;
}

export function WeekStrip({ days, selected, today, countOf, onSelect, onStep, onToday }: WeekStripProps) {
  return (
    <section
      aria-label="Semana"
      className="rounded-card border-border bg-surface shadow-card flex flex-col gap-3 border p-3 lg:p-4"
    >
      <div className="flex items-center gap-3">
        <p className="text-text flex-1 font-semibold">{formatMonth(middayOf(selected))}</p>
        <div role="group" aria-label="Navegar na agenda" className="flex items-center gap-1.5">
          <IconButton
            label="Semana anterior"
            icon={<LuChevronLeft />}
            className={stepButton}
            onClick={() => onStep(-1)}
          />
          <Button variant="secondary" size="sm" onClick={onToday}>
            Hoje
          </Button>
          <IconButton
            label="Próxima semana"
            icon={<LuChevronRight />}
            className={stepButton}
            onClick={() => onStep(1)}
          />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const count = countOf(day);
          const on = day === selected;
          const { weekday, day: number } = dayTile(middayOf(day));
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              aria-current={day === today ? 'date' : undefined}
              aria-label={`${formatLongDay(middayOf(day))}${count === undefined ? '' : `, ${plural(count, 'consulta', 'consultas')}`}`}
              onClick={() => onSelect(day)}
              className={cx(
                'rounded-tile flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 transition-colors duration-150',
                on ? 'bg-role-strong text-on-role' : 'text-text-secondary can-hover:bg-surface-muted',
              )}
            >
              <span className="text-[0.6875rem] font-semibold uppercase">{weekday}</span>
              <b className={cx('text-lg/none tabular-nums', !on && day === today && 'text-role-text')}>
                {number}
              </b>
              <i
                aria-hidden
                className={cx(
                  'size-1.5 rounded-full',
                  count ? (on ? 'bg-on-role' : 'bg-role-strong') : 'bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
