import type { ResponseOf } from '@lib/api/api-fetch';
import { addDays, todayInSaoPaulo } from '@lib/date';

const WINDOW_DAYS = 31;
const MAX_HORIZON_DAYS = 365;

type DoctorDay = ResponseOf<'/api/doctors/{id}/availability', 'get'>['days'][number];
type ExamDay = ResponseOf<'/api/exam-availability', 'get'>['days'][number];

export type AvailableDay = DoctorDay | ExamDay;
export type Slot = AvailableDay['slots'][number];

export interface WindowPage {
  start: string;
  page: number;
}

const lastOffset = (window: number) => Math.min((window + 1) * WINDOW_DAYS - 1, MAX_HORIZON_DAYS);

export const firstWindowPage = (): WindowPage => ({ start: todayInSaoPaulo(), page: 0 });

export const loadedThrough = (start: string, pages: number) => addDays(start, lastOffset(pages));

export const nextWindowPage = (start: string, pages: number): WindowPage | undefined =>
  (pages + 1) * WINDOW_DAYS <= MAX_HORIZON_DAYS ? { start, page: pages } : undefined;

export const horizonEnd = (start: string) => addDays(start, MAX_HORIZON_DAYS);

export async function inWindows<D extends AvailableDay>(
  load: (from: string, to: string) => Promise<{ days: D[] }>,
  { start, page }: WindowPage,
): Promise<D[]> {
  const windows = await Promise.all(
    (page === 0 ? [0, 1] : [page + 1]).map((window) =>
      load(addDays(start, window * WINDOW_DAYS), addDays(start, lastOffset(window))),
    ),
  );
  return windows.flatMap(({ days }) => days);
}
