import type { ResponseOf } from '@lib/api/api-fetch';
import { addDays, todayInSaoPaulo } from '@lib/date';

const WINDOW_DAYS = 31;
const MAX_HORIZON_DAYS = 365;

type DoctorDay = ResponseOf<'/api/doctors/{id}/availability', 'get'>['days'][number];
type ExamDay = ResponseOf<'/api/exam-availability', 'get'>['days'][number];

export type AvailableDay = DoctorDay | ExamDay;
export type Slot = AvailableDay['slots'][number];

const lastOffset = (window: number) => Math.min((window + 1) * WINDOW_DAYS - 1, MAX_HORIZON_DAYS);

export const loadedThrough = (pages: number) => addDays(todayInSaoPaulo(), lastOffset(pages));

export const nextWindowPage = (pages: number) =>
  (pages + 1) * WINDOW_DAYS <= MAX_HORIZON_DAYS ? pages : undefined;

export const horizonEnd = () => addDays(todayInSaoPaulo(), MAX_HORIZON_DAYS);

export async function inWindows<D extends AvailableDay>(
  load: (from: string, to: string) => Promise<{ days: D[] }>,
  page: number,
): Promise<D[]> {
  const today = todayInSaoPaulo();
  const windows = await Promise.all(
    (page === 0 ? [0, 1] : [page + 1]).map((window) =>
      load(addDays(today, window * WINDOW_DAYS), addDays(today, lastOffset(window))),
    ),
  );
  return windows.flatMap(({ days }) => days);
}
