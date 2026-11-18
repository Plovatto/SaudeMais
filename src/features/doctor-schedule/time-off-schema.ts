import { z } from 'zod';
import type { TimeOffBody } from './schedule-api';

export const REASON_MAX = 80;

export const timeOffSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha a data.'),
  reason: z
    .string()
    .refine((value) => value.trim().length <= REASON_MAX, `Use até ${REASON_MAX} caracteres.`),
});

export type TimeOffValues = z.infer<typeof timeOffSchema>;

export function toTimeOffBody({ date, reason }: TimeOffValues): TimeOffBody {
  const trimmed = reason.trim();
  return trimmed ? { date, reason: trimmed } : { date };
}
