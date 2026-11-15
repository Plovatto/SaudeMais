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
  availability: (doctorId: string, signal: AbortSignal) =>
    inWindows((from, to) =>
      apiFetch('get', '/api/doctors/{id}/availability', {
        params: { id: doctorId },
        query: { from, to },
        signal,
      }),
    ),
  book: (body: BodyOf<'/api/appointments', 'post'>) => apiFetch('post', '/api/appointments', { body }),
};
