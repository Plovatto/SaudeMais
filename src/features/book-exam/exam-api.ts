import { inWindows } from '@components/booking-form/availability';
import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

export type ExamBooking = ResponseOf<'/api/exam-bookings', 'post'>;

export const examApi = {
  availability: (unitId: string, examTypeId: string, signal: AbortSignal) =>
    inWindows((from, to) =>
      apiFetch('get', '/api/exam-availability', { query: { unitId, examTypeId, from, to }, signal }),
    ),
  book: (body: BodyOf<'/api/exam-bookings', 'post'>) => apiFetch('post', '/api/exam-bookings', { body }),
};
