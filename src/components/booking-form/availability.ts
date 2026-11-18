import type { ResponseOf } from '@lib/api/api-fetch';
import { addDays, todayInSaoPaulo } from '@lib/date';

const WINDOW_DAYS = 31;
const WINDOWS_PER_BATCH = 2;
const MAX_HORIZON_DAYS = 365;

type DoctorDay = ResponseOf<'/api/doctors/{id}/availability', 'get'>['days'][number];
type ExamDay = ResponseOf<'/api/exam-availability', 'get'>['days'][number];

export type AvailableDay = DoctorDay | ExamDay;
export type Slot = AvailableDay['slots'][number];

export async function inWindows<D extends AvailableDay>(
  load: (from: string, to: string) => Promise<{ days: D[] }>,
): Promise<D[]> {
  const today = todayInSaoPaulo();
  const found: D[] = [];
  for (let start = 0; start <= MAX_HORIZON_DAYS; start += WINDOW_DAYS * WINDOWS_PER_BATCH) {
    const batch = await Promise.all(
      Array.from({ length: WINDOWS_PER_BATCH }, (_value, index) => {
        const offset = start + index * WINDOW_DAYS;
        const end = Math.min(offset + WINDOW_DAYS - 1, MAX_HORIZON_DAYS);
        return load(addDays(today, offset), addDays(today, end));
      }),
    );
    found.push(...batch.flatMap(({ days }) => days));
    if (batch.at(-1)?.days.length === 0) break;
  }
  return found;
}
