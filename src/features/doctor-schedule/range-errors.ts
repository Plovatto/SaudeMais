import type { FieldErrors, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@lib/api/api-error';
import { DAY_ORDER, MAX_RANGES, rangePath, type ScheduleValues } from './schedule-schema';

const RANGE_FIELD = /^days\.(\d+)\.ranges\.(\d+)(?:\.(?:startMin|endMin))?$/;

export type RangePath = ReturnType<typeof rangePath>;

export function rangeError(errors: FieldErrors<ScheduleValues>, weekday: number, index: number) {
  return errors.days?.[weekday]?.ranges?.[index]?.message;
}

export const weekdayOf = (path: RangePath) => Number(path.split('.')[1]);

const position = (path: RangePath) =>
  DAY_ORDER.indexOf(weekdayOf(path)) * MAX_RANGES + Number(path.split('.')[3]);

export function rangeErrorPaths(errors: FieldErrors<ScheduleValues>): RangePath[] {
  return DAY_ORDER.flatMap((weekday) =>
    Array.from({ length: MAX_RANGES }, (_value, index) => index)
      .filter((index) => rangeError(errors, weekday, index))
      .map((index) => rangePath(weekday, index)),
  );
}

export function applyRangeErrors(error: unknown, setError: UseFormSetError<ScheduleValues>): RangePath[] {
  if (!(error instanceof ApiError)) return [];
  const paths: RangePath[] = Object.entries(error.fields).flatMap(([key, message]) => {
    const match = RANGE_FIELD.exec(key);
    if (!match) return [];
    const path = rangePath(Number(match[1]), Number(match[2]));
    setError(path, { type: 'server', message });
    return [path];
  });
  return paths.sort((a, b) => position(a) - position(b));
}
