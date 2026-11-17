import { useState, type Ref } from 'react';
import { cx } from '@lib/cx';
import { moveFocus } from '@lib/roving-index';
import { formatLongDay, formatTime, middayOf } from '@lib/date';
import type { Slot } from './availability';

const FEW_PLACES = 3;

const PERIODS = [
  { id: 'manha', label: 'Manhã', fits: (hour: number) => hour < 12 },
  { id: 'tarde', label: 'Tarde', fits: (hour: number) => hour >= 12 && hour < 18 },
  { id: 'noite', label: 'Noite', fits: (hour: number) => hour >= 18 },
] as const;

type PeriodId = (typeof PERIODS)[number]['id'];

const hourOf = (startsAt: string) => Number(formatTime(startsAt).slice(0, 2));
const periodOf = (startsAt: string): PeriodId =>
  PERIODS.find(({ fits }) => fits(hourOf(startsAt)))?.id ?? 'manha';

const placesLeft = (slot: Slot) =>
  'remaining' in slot && slot.remaining <= FEW_PLACES
    ? slot.remaining === 1
      ? '1 vaga'
      : `${slot.remaining} vagas`
    : null;

export interface SlotPickerProps {
  date: string;
  slots: readonly Slot[];
  value: string;
  onPick: (startsAt: string) => void;
  current?: string | undefined;
  focusRef?: Ref<HTMLDivElement>;
  describedBy?: string | undefined;
}

export function SlotPicker({ date, slots, value, onPick, current, focusRef, describedBy }: SlotPickerProps) {
  const groups = PERIODS.map((period) => ({
    ...period,
    slots: slots.filter((slot) => period.fits(hourOf(slot.startsAt))),
  })).filter((period) => period.slots.length > 0);
  const [chosen, setChosen] = useState<PeriodId | null>(null);
  const preferred = chosen ?? (value ? periodOf(value) : groups[0]?.id);
  const active = groups.find((period) => period.id === preferred) ?? groups[0];
  const free = slots.filter((slot) => slot.startsAt !== current).length;
  const hasChecked = active?.slots.some((slot) => slot.startsAt === value) ?? false;
  const firstFree = active?.slots.find((slot) => slot.startsAt !== current)?.startsAt;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-text text-sm font-semibold">{formatLongDay(middayOf(date))}</p>
        <p className="text-text-muted text-[0.8125rem] tabular-nums">
          {free === 1 ? '1 horário livre' : `${free} horários livres`}
        </p>
      </div>
      {groups.length > 1 && (
        <div
          role="group"
          aria-label="Período"
          className="bg-surface-strong rounded-field flex gap-0.5 self-start p-[3px]"
        >
          {groups.map((period) => (
            <button
              key={period.id}
              type="button"
              aria-pressed={period.id === active?.id}
              onClick={() => setChosen(period.id)}
              className={cx(
                'inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[0.8125rem] font-semibold transition-[background-color,color,box-shadow] duration-150',
                period.id === active?.id
                  ? 'bg-surface text-text shadow-[0_1px_2px_rgb(16_42_41/0.08),0_0_0_1px_var(--border)]'
                  : 'text-text-secondary can-hover:text-text',
              )}
            >
              {period.label}
              <span className="text-text-muted text-xs tabular-nums">{period.slots.length}</span>
            </button>
          ))}
        </div>
      )}
      <div
        ref={focusRef}
        tabIndex={-1}
        role="radiogroup"
        aria-label="Horários livres"
        aria-describedby={describedBy}
        onKeyDown={(event) => moveFocus(event, '[role="radio"]', 'horizontal', { check: true })}
        className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2 focus-visible:outline-none"
      >
        {active?.slots.map((slot) => {
          const selected = slot.startsAt === value;
          const isCurrent = slot.startsAt === current;
          const places = placesLeft(slot);
          return (
            <button
              key={slot.startsAt}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!hasChecked && slot.startsAt === firstFree) ? 0 : -1}
              disabled={isCurrent}
              onClick={() => onPick(slot.startsAt)}
              className={cx(
                'rounded-field pressable:scale-95 flex min-h-11 flex-col items-center justify-center border px-1 text-sm font-semibold tabular-nums transition-[background-color,border-color,color,scale] duration-150 lg:min-h-10',
                selected
                  ? 'border-role-strong bg-role-strong text-on-role'
                  : 'border-border-strong bg-surface text-text can-hover:border-role-strong can-hover:text-role-text',
                isCurrent && 'bg-surface-muted text-text-muted cursor-not-allowed line-through',
              )}
            >
              {formatTime(slot.startsAt)}
              {(isCurrent || places) && (
                <span className="text-[0.6875rem] font-medium no-underline opacity-80">
                  {isCurrent ? 'atual' : places}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
