import { useEffect, useId, useMemo, useRef } from 'react';
import { Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { LuCalendar, LuPlus } from 'react-icons/lu';
import { Button, Card, IconSlot, Switch } from '@components/ui';
import { WEEKDAYS } from '@constants/weekdays';
import { cx } from '@lib/cx';
import { formatTimeRange } from '@lib/time-of-day';
import { rangeError } from './range-errors';
import { RangeRow } from './RangeRow';
import type { UnitHours } from './schedule-api';
import { DAY_END, MAX_RANGES, nextRange, rangePath, STEP, type ScheduleValues } from './schedule-schema';
import { timeOptions } from './time-options';

interface DayCardProps {
  form: UseFormReturn<ScheduleValues>;
  weekday: number;
  unit: UnitHours[number] | undefined;
}

function summary(count: number, isActive: boolean): string {
  if (count === 0) return 'Nenhum horário configurado';
  const ranges = count === 1 ? '1 horário configurado' : `${count} horários configurados`;
  return isActive ? ranges : `${ranges} · não gera vagas`;
}

export function DayCard({ form, weekday, unit }: DayCardProps) {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const removedIndex = useRef<number | null>(null);
  const { control, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: `days.${weekday}.ranges` });
  const { isActive, ranges } = useWatch({ control, name: `days.${weekday}` });
  const open = unit?.openMin ?? 0;
  const close = unit?.closeMin ?? DAY_END;
  const options = useMemo(
    () => ({ start: timeOptions(open, close - STEP), end: timeOptions(open + STEP, close) }),
    [open, close],
  );
  const name = WEEKDAYS[weekday] ?? '';
  const dayName = name.toLowerCase();
  const next = fields.length < MAX_RANGES ? nextRange(ranges, unit) : null;

  useEffect(() => {
    const index = removedIndex.current;
    const section = sectionRef.current;
    if (index === null || !section) return;
    removedIndex.current = null;
    const add = addRef.current;
    const removeButtons = section.querySelectorAll<HTMLButtonElement>('[data-remove-range]');
    const target =
      add && !add.disabled
        ? add
        : (removeButtons[index - 1] ??
          removeButtons[0] ??
          section.querySelector<HTMLElement>('[role="switch"]'));
    target?.focus();
  }, [fields]);

  return (
    <section ref={sectionRef} aria-labelledby={titleId}>
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-start gap-3">
          <IconSlot className="text-role-text mt-0.5 text-xl">
            <LuCalendar />
          </IconSlot>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 id={titleId} className="text-text font-semibold">
              {name}
            </h2>
            <p className="text-text-secondary text-sm">{summary(fields.length, isActive)}</p>
            <p className="text-text-secondary text-sm">
              {unit
                ? `Unidade aberta ${formatTimeRange(unit.openMin, unit.closeMin)}`
                : 'Unidade fechada — sem faixas'}
            </p>
          </div>
          <Controller
            control={control}
            name={`days.${weekday}.isActive`}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Ativo"
                ariaLabel={`Ativo: ${name}`}
                className="-my-2.5 flex-row-reverse"
              />
            )}
          />
        </header>
        {fields.length > 0 && (
          <ul
            aria-label={`Faixas de ${dayName}`}
            className={cx('flex flex-col gap-3', !isActive && 'opacity-75')}
          >
            {fields.map((field, index) => (
              <RangeRow
                key={field.id}
                form={form}
                weekday={weekday}
                index={index}
                dayName={dayName}
                options={options}
                error={rangeError(formState.errors, weekday, index)}
                onRemove={() => {
                  removedIndex.current = index;
                  remove(index);
                }}
              />
            ))}
          </ul>
        )}
        {isActive && unit && (
          <Button
            ref={addRef}
            variant="ghost"
            fullWidth
            icon={<LuPlus />}
            disabled={!next}
            onClick={() => {
              if (next) append(next, { focusName: `${rangePath(weekday, fields.length)}.startMin` });
            }}
            className="border-border bg-surface-muted text-text border"
          >
            Adicionar Horário
          </Button>
        )}
      </Card>
    </section>
  );
}
