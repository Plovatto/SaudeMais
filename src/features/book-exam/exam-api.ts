import { inWindows } from '@components/booking-form/availability';
import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';
import { formatDateTime } from '@lib/date';

export type ExamBooking = ResponseOf<'/api/exam-bookings', 'post'>;

export const describeExam = ({ examType, unit, startsAt, publicCode }: ExamBooking) =>
  `${examType.name} em ${unit.name}, ${formatDateTime(startsAt)}. Apresente o código ${publicCode} na unidade.`;

export const examApi = {
  availability: (unitId: string, examTypeId: string, signal: AbortSignal, rescheduling?: string) =>
    inWindows((from, to) =>
      apiFetch('get', '/api/exam-availability', {
        query: { unitId, examTypeId, from, to, rescheduling },
        signal,
      }),
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
