import { useId } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { LuClock, LuX } from 'react-icons/lu';
import { FieldError, IconButton, IconSlot, Select } from '@components/ui';
import { formatTimeRange } from '@lib/time-of-day';
import { rangePath, type ScheduleValues } from './schedule-schema';
import { timeOption, type TimeOptions } from './time-options';

interface RangeRowProps {
  form: UseFormReturn<ScheduleValues>;
  weekday: number;
  index: number;
  dayName: string;
  options: { start: TimeOptions; end: TimeOptions };
  error: string | undefined;
  onRemove: () => void;
}

export function RangeRow({ form, weekday, index, dayName, options, error, onRemove }: RangeRowProps) {
  const errorId = useId();
  const path = rangePath(weekday, index);
  const { startMin, endMin } = useWatch({ control: form.control, name: path });
  const time = (
    key: 'startMin' | 'endMin',
    label: string,
    { values, elements }: TimeOptions,
    current: number,
  ) => (
    <Select
      label={`${label} da faixa ${index + 1} de ${dayName}`}
      labelHidden
      compact
      invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      {...form.register(`${path}.${key}`, { valueAsNumber: true })}
    >
      {!values.has(current) && timeOption(current)}
      {elements}
    </Select>
  );
  return (
    <li className="flex flex-col gap-1.5">
      <div className="min-[25rem]:rounded-tile min-[25rem]:border-border flex items-center gap-1 min-[25rem]:gap-2 min-[25rem]:border min-[25rem]:p-2 sm:gap-3 sm:p-3">
        <IconSlot className="text-text-secondary hidden text-xl sm:inline-flex">
          <LuClock />
        </IconSlot>
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-2">
          {time('startMin', 'Início', options.start, startMin)}
          <span aria-hidden className="text-text-secondary text-sm font-semibold">
            às
          </span>
          {time('endMin', 'Fim', options.end, endMin)}
        </div>
        <IconButton
          data-remove-range
          label={`Remover faixa ${formatTimeRange(startMin, endMin)} de ${dayName}`}
          icon={<LuX />}
          onClick={onRemove}
          className="text-danger-text"
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </li>
  );
}
