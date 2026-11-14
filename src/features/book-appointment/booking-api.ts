import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';
import { addDays, todayInSaoPaulo } from '@lib/date';

const DOCTORS_PAGE_SIZE = 50;
const WINDOW_DAYS = 31;
const WINDOWS = 2;

type AvailableDay = ResponseOf<'/api/doctors/{id}/availability', 'get'>['days'][number];
export type Appointment = ResponseOf<'/api/appointments', 'post'>;

async function availability(doctorId: string, signal: AbortSignal): Promise<AvailableDay[]> {
  const today = todayInSaoPaulo();
  const windows = await Promise.all(
    Array.from({ length: WINDOWS }, (_value, index) => {
      const from = addDays(today, index * WINDOW_DAYS);
      return apiFetch('get', '/api/doctors/{id}/availability', {
        params: { id: doctorId },
        query: { from, to: addDays(from, WINDOW_DAYS - 1) },
        signal,
      });
    }),
  );
  return windows.flatMap(({ days }) => days);
}

export const bookingApi = {
  doctors: async (specialtyId: string, signal: AbortSignal) =>
    (
      await apiFetch('get', '/api/doctors', {
        query: { pageSize: DOCTORS_PAGE_SIZE, ...(specialtyId && { specialtyId }) },
        signal,
      })
    ).items,
  availability,
  book: (body: BodyOf<'/api/appointments', 'post'>) => apiFetch('post', '/api/appointments', { body }),
};
