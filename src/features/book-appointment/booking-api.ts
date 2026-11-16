import { inWindows } from '@components/booking-form/availability';
import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

const DOCTORS_PAGE_SIZE = 50;

export type Appointment = ResponseOf<'/api/appointments', 'post'>;

export const bookingApi = {
  doctors: async (specialtyId: string, signal: AbortSignal) =>
    (
      await apiFetch('get', '/api/doctors', {
        query: { pageSize: DOCTORS_PAGE_SIZE, ...(specialtyId && { specialtyId }) },
        signal,
      })
    ).items,
  availability: (doctorId: string, signal: AbortSignal, rescheduling?: string) =>
    inWindows((from, to) =>
      apiFetch('get', '/api/doctors/{id}/availability', {
        params: { id: doctorId },
        query: { from, to, rescheduling },
        signal,
      }),
    ),
  book: (body: BodyOf<'/api/appointments', 'post'>) => apiFetch('post', '/api/appointments', { body }),
  detail: (id: string, signal: AbortSignal) =>
    apiFetch('get', '/api/appointments/{id}', { params: { id }, signal }),
  reschedule: ({ id, startsAt }: Appointment, newStartsAt: string) =>
    apiFetch('post', '/api/appointments/{id}/reschedule', {
      params: { id },
      body: { startsAt, newStartsAt },
    }),
};
