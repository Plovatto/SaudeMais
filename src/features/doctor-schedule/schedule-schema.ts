import { z } from 'zod';
import { WEEKDAYS } from '@constants/weekdays';
import { formatTimeRange } from '@lib/time-of-day';
import type { DoctorSchedule, UnitHours } from './schedule-api';

export const MAX_RANGES = 12;
export const DAY_END = 24 * 60;
export const STEP = 5;

const range = z.object({ startMin: z.number().int(), endMin: z.number().int() });
const day = z.object({ isActive: z.boolean(), ranges: z.array(range).max(MAX_RANGES) });

export type ScheduleValues = { days: z.infer<typeof day>[] };
type Range = z.infer<typeof range>;

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
  return z.object({ days: z.array(day).length(WEEKDAYS.length) }).superRefine(({ days }, context) => {
    days.forEach(({ ranges }, weekday) => {
      const overlaps = overlapping(ranges);
      const unit = unitFor(unitHours, weekday);
      ranges.forEach((item, index) => {
        const message =
          item.startMin >= item.endMin
            ? 'O fim precisa ser depois do início.'
            : overlaps.has(index)
              ? 'Esta faixa se sobrepõe a outra do mesmo dia.'
              : unitMessage(item, unit);
        if (message) context.addIssue({ code: 'custom', path: ['days', weekday, 'ranges', index], message });
      });
    });
  });
}

export function toValues({ days }: Pick<DoctorSchedule, 'days'>): ScheduleValues {
  return {
    days: WEEKDAYS.map((_name, weekday) => {
      const found = days.find((entry) => entry.weekday === weekday);
      return {
        isActive: found?.isActive ?? false,
        ranges: (found?.ranges ?? []).map(({ startMin, endMin }) => ({ startMin, endMin })),
      };
    }),
  };
}

export const toBody = ({ days }: ScheduleValues) => ({
  days: days.map((entry, weekday) => ({ weekday, ...entry })),
});

export function nextRange(ranges: Range[], unit: UnitHour | undefined): Range | null {
  if (!unit) return null;
  const startMin = Math.max(unit.openMin, ...ranges.map((item) => item.endMin));
  if (startMin + STEP > unit.closeMin) return null;
  return { startMin, endMin: Math.min(startMin + 4 * 60, unit.closeMin) };
}
