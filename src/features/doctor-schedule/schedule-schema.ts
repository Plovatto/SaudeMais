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

function unitMessage(item: Range, unit: UnitHours[number] | undefined): string | null {
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
      const unit = unitHours.find((hours) => hours.weekday === weekday);
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

export function nextRange(ranges: Range[], unit: UnitHours[number] | undefined): Range | null {
  const last = ranges.at(-1);
  const startMin = last ? last.endMin : (unit?.openMin ?? 8 * 60);
  const limit = unit && unit.closeMin > startMin ? unit.closeMin : DAY_END;
  if (startMin >= DAY_END) return null;
  return { startMin, endMin: Math.min(startMin + 4 * 60, limit) };
}
