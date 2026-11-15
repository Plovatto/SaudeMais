import type { ResponseOf } from '@lib/api/api-fetch';
import { addDays, todayInSaoPaulo } from '@lib/date';

const WINDOW_DAYS = 31;
const WINDOWS = 2;

type DoctorDay = ResponseOf<'/api/doctors/{id}/availability', 'get'>['days'][number];
type ExamDay = ResponseOf<'/api/exam-availability', 'get'>['days'][number];

export type AvailableDay = DoctorDay | ExamDay;
export type Slot = AvailableDay['slots'][number];

export async function inWindows<D extends AvailableDay>(
  load: (from: string, to: string) => Promise<{ days: D[] }>,
): Promise<D[]> {
  const today = todayInSaoPaulo();
  const windows = await Promise.all(
    Array.from({ length: WINDOWS }, (_value, index) => {
      const from = addDays(today, index * WINDOW_DAYS);
      return load(from, addDays(from, WINDOW_DAYS - 1));
    }),
  );
  return windows.flatMap(({ days }) => days);
}
