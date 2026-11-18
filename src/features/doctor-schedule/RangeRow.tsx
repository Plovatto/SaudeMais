import { useId } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { LuClock } from 'react-icons/lu';
import { CloseButton, FieldError, IconSlot, Select } from '@components/ui';
import { fromMinutes } from '@lib/time-of-day';
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
      label={`${dayName}, ${label} do período ${index + 1}`}
      labelHidden
      compact
      invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      className="font-semibold tabular-nums"
      {...form.register(`${path}.${key}`, { valueAsNumber: true })}
    >
      {!values.has(current) && timeOption(current)}
      {elements}
    </Select>
  );
  return (
    <li className="flex flex-col gap-1.5">
      <div className="rounded-tile border-border bg-surface-muted flex items-center gap-2 border py-2 ps-2.5 pe-1.5 lg:gap-2.5 lg:py-2.5 lg:ps-3 lg:pe-2.5">
        <IconSlot className="text-text-muted text-lg max-[23.75rem]:hidden">
          <LuClock />
        </IconSlot>
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:max-w-80">
          {time('startMin', 'início', options.start, startMin)}
          <span aria-hidden className="text-text-muted text-[0.8125rem]">
            às
          </span>
          {time('endMin', 'fim', options.end, endMin)}
        </div>
        <CloseButton
          data-remove-range
          label={`Remover período de ${fromMinutes(startMin)} às ${fromMinutes(endMin)}`}
          onClick={onRemove}
          className="text-danger-text can-hover:bg-danger-soft can-hover:text-danger-text ms-auto"
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </li>
  );
}
