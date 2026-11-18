import { z } from 'zod';
import { WEEKDAYS } from '@constants/weekdays';
import { formatTimeRange } from '@lib/time-of-day';
import type { DoctorSchedule, DurationMin, ScheduleBody, UnitHours } from './schedule-api';

export const MAX_RANGES = 12;
export const DAY_END = 24 * 60;
export const STEP = 5;
export const DAY_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

const range = z.object({ startMin: z.number().int(), endMin: z.number().int() });
const day = z.object({ isActive: z.boolean(), ranges: z.array(range).max(MAX_RANGES) });

export type ScheduleValues = { days: Day[]; appointmentDurationMin: number };
type Day = z.infer<typeof day>;
type Range = z.infer<typeof range>;

export const DURATIONS: readonly { value: DurationMin; hint: string }[] = [
  { value: 15, hint: '4 consultas por hora' },
  { value: 20, hint: '3 consultas por hora' },
  { value: 30, hint: '2 consultas por hora' },
  { value: 45, hint: 'Para consultas longas' },
  { value: 60, hint: '1 consulta por hora' },
];

type UnitHour = UnitHours[number];

export const unitFor = (unitHours: UnitHours, weekday: number): UnitHour | undefined =>
  unitHours.find((hours) => hours.weekday === weekday);

export const rangePath = (weekday: number, index: number) => `days.${weekday}.ranges.${index}` as const;

function overlapping(ranges: Range[]): Set<number> {
  const flagged = new Set<number>();
  let latestEnd = -1;
  ranges
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => a.startMin - b.startMin)
    .forEach((item) => {
      if (item.startMin < latestEnd) flagged.add(item.index);
      latestEnd = Math.max(latestEnd, item.endMin);
    });
  return flagged;
}

function unitMessage(item: Range, unit: UnitHour | undefined): string | null {
  if (!unit) return 'A unidade não abre neste dia.';
  if (item.startMin < unit.openMin || item.endMin > unit.closeMin) {
    return `Fora do horário da unidade (${formatTimeRange(unit.openMin, unit.closeMin)}).`;
  }
  return null;
}

export function scheduleSchema(unitHours: UnitHours) {
  const shape = { days: z.array(day).length(WEEKDAYS.length), appointmentDurationMin: z.number().int() };
  return z.object(shape).superRefine(({ days }, context) => {
    days.forEach(({ ranges }, weekday) => {
      const overlaps = overlapping(ranges);
      const unit = unitFor(unitHours, weekday);
      ranges.forEach((item, index) => {
        const message =
          item.startMin >= item.endMin
            ? 'O fim precisa ser depois do início.'
            : overlaps.has(index)
              ? 'Este período se sobrepõe a outro do mesmo dia.'
              : unitMessage(item, unit);
        if (message) context.addIssue({ code: 'custom', path: ['days', weekday, 'ranges', index], message });
      });
    });
  });
}

export function toValues({ days, appointmentDurationMin }: DoctorSchedule): ScheduleValues {
  return {
    appointmentDurationMin,
    days: WEEKDAYS.map((_name, weekday) => {
      const found = days.find((entry) => entry.weekday === weekday);
      return {
        isActive: found?.isActive ?? false,
        ranges: (found?.ranges ?? []).map(({ startMin, endMin }) => ({ startMin, endMin })),
      };
    }),
  };
}

const durationOf = (value: number) => DURATIONS.find((option) => option.value === value)?.value;

export function toBody(
  { days, appointmentDurationMin }: ScheduleValues,
  loaded: DoctorSchedule,
): ScheduleBody {
  const body = { days: days.map((entry, weekday) => ({ weekday, ...entry })) };
  if (appointmentDurationMin === loaded.appointmentDurationMin) return body;
  if (appointmentDurationMin === loaded.specialtyDurationMin)
    return { ...body, appointmentDurationMin: null };
  const duration = durationOf(appointmentDurationMin);
  return duration === undefined ? body : { ...body, appointmentDurationMin: duration };
}

export function dayMinutes({ isActive, ranges }: Day): number {
  if (!isActive) return 0;
  let total = 0;
  let coveredUntil = -1;
  [...ranges]
    .sort((a, b) => a.startMin - b.startMin)
    .forEach(({ startMin, endMin }) => {
      const from = Math.max(startMin, coveredUntil);
      if (endMin <= from) return;
      total += endMin - from;
      coveredUntil = endMin;
    });
  return total;
}

export const weeklySlots = ({ days, appointmentDurationMin }: ScheduleValues) =>
  days.reduce((total, entry) => total + Math.floor(dayMinutes(entry) / appointmentDurationMin), 0);

export function nextRange(ranges: Range[], unit: UnitHour | undefined): Range | null {
  if (!unit) return null;
  const startMin = Math.max(unit.openMin, ...ranges.map((item) => item.endMin));
  if (startMin + STEP > unit.closeMin) return null;
  return { startMin, endMin: Math.min(startMin + 4 * 60, unit.closeMin) };
}
