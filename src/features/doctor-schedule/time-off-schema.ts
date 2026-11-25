import { z } from 'zod';
import { addDays, isDateWithin, todayInSaoPaulo, type DateLimits } from '@lib/date';
import type { TimeOffBody } from './schedule-api';

export const REASON_MAX = 80;

const DAYS_AHEAD = 365;

export function timeOffLimits(today = todayInSaoPaulo()): DateLimits {
  return { min: today, max: addDays(today, DAYS_AHEAD) };
}

export const timeOffSchema = z.object({
  date: z
    .string()
    .min(1, 'Escolha a data.')
    .refine(
      (value) => isDateWithin(value, timeOffLimits()),
      `Escolha hoje ou uma data em até ${DAYS_AHEAD} dias.`,
    ),
  reason: z
    .string()
    .refine((value) => value.trim().length <= REASON_MAX, `Use até ${REASON_MAX} caracteres.`),
});

export type TimeOffValues = z.infer<typeof timeOffSchema>;

export function toTimeOffBody({ date, reason }: TimeOffValues): TimeOffBody {
  const trimmed = reason.trim();
  return trimmed ? { date, reason: trimmed } : { date };
}
