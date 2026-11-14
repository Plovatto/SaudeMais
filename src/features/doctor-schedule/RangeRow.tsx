import { useId, useMemo, type ReactNode } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { LuClock, LuX } from 'react-icons/lu';
import { FieldError, IconButton, IconSlot, Select } from '@components/ui';
import { formatTimeRange, fromMinutes } from '@lib/time-of-day';
import type { UnitHours } from './schedule-api';
import { DAY_END, rangePath, STEP, type ScheduleValues } from './schedule-schema';

function minuteOptions(from: number, to: number, current: number) {
  const steps = Array.from({ length: (to - from) / STEP + 1 }, (_value, step) => from + step * STEP);
  const values = steps.includes(current) ? steps : [...steps, current].sort((a, b) => a - b);
  return values.map((minutes) => (
    <option key={minutes} value={minutes}>
      {fromMinutes(minutes)}
    </option>
  ));
}

export interface RangeRowProps {
  form: UseFormReturn<ScheduleValues>;
  weekday: number;
  index: number;
  dayName: string;
  unit: UnitHours[number] | undefined;
  error: string | undefined;
  onRemove: () => void;
}

export function RangeRow({ form, weekday, index, dayName, unit, error, onRemove }: RangeRowProps) {
  const errorId = useId();
  const path = rangePath(weekday, index);
  const { startMin, endMin } = useWatch({ control: form.control, name: path });
  const open = unit?.openMin ?? 0;
  const close = unit?.closeMin ?? DAY_END;
  const startOptions = useMemo(() => minuteOptions(open, close - STEP, startMin), [open, close, startMin]);
  const endOptions = useMemo(() => minuteOptions(open + STEP, close, endMin), [open, close, endMin]);
  const time = (key: 'startMin' | 'endMin', label: string, options: ReactNode) => (
    <Select
      label={`${label} da faixa ${index + 1} de ${dayName}`}
      labelHidden
      invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      {...form.register(`${path}.${key}`, { valueAsNumber: true })}
    >
      {options}
    </Select>
  );
  return (
    <li className="flex flex-col gap-1.5">
      <div className="min-[25rem]:rounded-tile min-[25rem]:border-border flex flex-wrap items-center gap-2 min-[25rem]:border min-[25rem]:p-2 sm:gap-3 sm:p-3">
        <IconSlot className="text-text-secondary hidden text-xl sm:inline-flex">
          <LuClock />
        </IconSlot>
        <div className="grid min-w-60 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          {time('startMin', 'Início', startOptions)}
          <span aria-hidden className="text-text-secondary text-sm font-semibold">
            às
          </span>
          {time('endMin', 'Fim', endOptions)}
        </div>
        <IconButton
          label={`Remover faixa ${formatTimeRange(startMin, endMin)} de ${dayName}`}
          icon={<LuX />}
          onClick={onRemove}
          className="text-danger-text ms-auto"
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </li>
  );
}
