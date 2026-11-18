import { inWindows } from '@components/booking-form/availability';
import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

export type ExamBooking = ResponseOf<'/api/exam-bookings', 'post'>;

export const examApi = {
  availability: (
    unitId: string,
    examTypeId: string,
    page: number,
    signal: AbortSignal,
    rescheduling?: string,
  ) =>
    inWindows(
      (from, to) =>
        apiFetch('get', '/api/exam-availability', {
          query: { unitId, examTypeId, from, to, rescheduling },
          signal,
        }),
      page,
    ),
  book: (body: BodyOf<'/api/exam-bookings', 'post'>) => apiFetch('post', '/api/exam-bookings', { body }),
  detail: (id: string, signal: AbortSignal) =>
    apiFetch('get', '/api/exam-bookings/{id}', { params: { id }, signal }),
  reschedule: ({ id, startsAt }: ExamBooking, newStartsAt: string) =>
    apiFetch('post', '/api/exam-bookings/{id}/reschedule', {
      params: { id },
      body: { startsAt, newStartsAt },
    }),
};
