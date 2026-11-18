import { useEffect, useId, useMemo, useRef } from 'react';
import { Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { LuCalendar, LuChevronDown } from 'react-icons/lu';
import { Card, IconButton, Switch } from '@components/ui';
import { softTones, tile } from '@components/ui/styles';
import { WEEKDAYS } from '@constants/weekdays';
import { cx } from '@lib/cx';
import { formatHours } from '@lib/number';
import { formatTimeRange } from '@lib/time-of-day';
import { AddButton } from './AddButton';
import { rangeError } from './range-errors';
import { RangeRow } from './RangeRow';
import type { UnitHours } from './schedule-api';
import {
  DAY_END,
  dayMinutes,
  MAX_RANGES,
  nextRange,
  rangePath,
  STEP,
  type ScheduleValues,
} from './schedule-schema';
import { timeOptions } from './time-options';

interface DayCardProps {
  form: UseFormReturn<ScheduleValues>;
  weekday: number;
  unit: UnitHours[number] | undefined;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const WEEKEND = new Set([0, 6]);

function servingLabel(weekday: number, name: string): string {
  const days = name
    .toLowerCase()
    .split('-')
    .map((word) => `${word}s`)
    .join('-');
  return `Atender ${WEEKEND.has(weekday) ? 'aos' : 'às'} ${days}`;
}

function Subline({ day }: { day: ScheduleValues['days'][number] }) {
  if (!day.isActive) return 'Sem atendimento';
  if (day.ranges.length === 0) return 'Nenhum período configurado';
  const ranges = [...day.ranges].sort((a, b) => a.startMin - b.startMin);
  return (
    <>
      <span className="tabular-nums">
        {ranges.map((item) => formatTimeRange(item.startMin, item.endMin)).join(', ')}
      </span>
      <span className="whitespace-nowrap max-[35rem]:hidden"> · {formatHours(dayMinutes(day))}</span>
    </>
  );
}

export function DayCard({ form, weekday, unit, expanded, onExpandedChange }: DayCardProps) {
  const titleId = useId();
  const bodyId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const removedIndex = useRef<number | null>(null);
  const { control, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: `days.${weekday}.ranges` });
  const day = useWatch({ control, name: `days.${weekday}` });
  const open = unit?.openMin ?? 0;
  const close = unit?.closeMin ?? DAY_END;
  const options = useMemo(
    () => ({ start: timeOptions(open, close - STEP), end: timeOptions(open + STEP, close) }),
    [open, close],
  );
  const name = WEEKDAYS[weekday] ?? '';
  const dayName = name.toLowerCase();
  const next = fields.length < MAX_RANGES ? nextRange(day.ranges, unit) : null;
  const errors = fields.map((_field, index) => rangeError(formState.errors, weekday, index));
  const canExpand = day.isActive || errors.some(Boolean);
  const isOpen = expanded && canExpand;

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
      <Card className="p-0">
        <div className={cx('flex items-center gap-3 px-4 py-3.5 lg:px-5 lg:py-4', isOpen && 'pb-3 lg:pb-3')}>
          <span aria-hidden className={cx(tile, !day.isActive && softTones.neutral)}>
            <LuCalendar />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2
              id={titleId}
              className={cx('text-sm font-semibold', day.isActive ? 'text-text' : 'text-text-secondary')}
            >
              {name}
            </h2>
            <p className="text-text-muted text-xs">
              <Subline day={day} />
            </p>
          </div>
          <span aria-hidden className="text-text-secondary text-xs font-semibold max-[35rem]:hidden">
            {day.isActive ? 'Ativo' : 'Inativo'}
          </span>
          <Controller
            control={control}
            name={`days.${weekday}.isActive`}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (!checked) return;
                  const first = fields.length === 0 ? nextRange([], unit) : null;
                  if (first) append(first, { shouldFocus: false });
                  onExpandedChange(true);
                }}
                label={servingLabel(weekday, name)}
                labelHidden
                className="cursor-pointer"
              />
            )}
          />
          {canExpand ? (
            <IconButton
              label={`${isOpen ? 'Fechar' : 'Ver'} horários de ${dayName}`}
              icon={
                <LuChevronDown
                  className={cx(
                    'motion-safe:transition-transform motion-safe:duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              }
              aria-expanded={isOpen}
              aria-controls={isOpen ? bodyId : undefined}
              onClick={() => onExpandedChange(!isOpen)}
              className="aria-expanded:text-text-secondary -ms-1.5 cursor-pointer aria-expanded:bg-transparent"
            />
          ) : (
            <span aria-hidden className="-ms-1.5 size-11 shrink-0 lg:size-10" />
          )}
        </div>
        {isOpen && (
          <div
            id={bodyId}
            className="motion-safe:animate-rise flex flex-col gap-2.5 px-4 pb-4 lg:px-5 lg:pb-5"
          >
            <p className="text-text-muted text-xs">
              {unit
                ? `Unidade aberta ${formatTimeRange(unit.openMin, unit.closeMin)}`
                : 'A unidade não abre neste dia.'}
            </p>
            {fields.length > 0 && (
              <ul
                aria-label={`Períodos de ${dayName}`}
                className={cx('flex flex-col gap-2.5', !day.isActive && 'opacity-75')}
              >
                {fields.map((field, index) => (
                  <RangeRow
                    key={field.id}
                    form={form}
                    weekday={weekday}
                    index={index}
                    dayName={name}
                    options={options}
                    error={errors[index]}
                    onRemove={() => {
                      removedIndex.current = index;
                      remove(index);
                    }}
                  />
                ))}
              </ul>
            )}
            {day.isActive && unit && (
              <AddButton
                ref={addRef}
                disabled={!next}
                onClick={() => {
                  if (next) append(next, { focusName: `${rangePath(weekday, fields.length)}.startMin` });
                }}
              >
                Adicionar período
              </AddButton>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}
