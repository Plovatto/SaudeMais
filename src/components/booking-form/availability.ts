import { addDays, todayInSaoPaulo } from '@lib/date';

const WINDOW_DAYS = 31;
const WINDOWS = 2;

export interface Slot {
  startsAt: string;
  endsAt: string;
  remaining?: number;
}

export interface AvailableDay {
  date: string;
  slots: Slot[];
}

export async function inWindows(
  load: (from: string, to: string) => Promise<{ days: AvailableDay[] }>,
): Promise<AvailableDay[]> {
  const today = todayInSaoPaulo();
  const windows = await Promise.all(
    Array.from({ length: WINDOWS }, (_value, index) => {
      const from = addDays(today, index * WINDOW_DAYS);
      return load(from, addDays(from, WINDOW_DAYS - 1));
    }),
  );
  return windows.flatMap(({ days }) => days);
}
