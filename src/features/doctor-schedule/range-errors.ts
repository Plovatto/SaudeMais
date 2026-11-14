import type { FieldErrors, UseFormSetError, UseFormSetFocus } from 'react-hook-form';
import { WEEKDAYS } from '@constants/weekdays';
import { ApiError } from '@lib/api/api-error';
import { MAX_RANGES, rangePath, type ScheduleValues } from './schedule-schema';

const RANGE_FIELD = /^days\.(\d+)\.ranges\.(\d+)(?:\.(?:startMin|endMin))?$/;

type RangePath = ReturnType<typeof rangePath>;

export function rangeError(errors: FieldErrors<ScheduleValues>, weekday: number, index: number) {
  return errors.days?.[weekday]?.ranges?.[index]?.message;
}

export function firstRangeError(errors: FieldErrors<ScheduleValues>): RangePath | undefined {
  for (let weekday = 0; weekday < WEEKDAYS.length; weekday += 1) {
    for (let index = 0; index < MAX_RANGES; index += 1) {
      if (rangeError(errors, weekday, index)) return rangePath(weekday, index);
    }
  }
  return undefined;
}

export function applyRangeErrors(
  error: unknown,
  setError: UseFormSetError<ScheduleValues>,
  setFocus: UseFormSetFocus<ScheduleValues>,
): boolean {
  if (!(error instanceof ApiError)) return false;
  const paths: RangePath[] = Object.entries(error.fields).flatMap(([key, message]) => {
    const match = RANGE_FIELD.exec(key);
    if (!match) return [];
    const path = rangePath(Number(match[1]), Number(match[2]));
    setError(path, { type: 'server', message });
    return [path];
  });
  const [first] = paths.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (first) setFocus(`${first}.startMin`);
  return first !== undefined;
}
