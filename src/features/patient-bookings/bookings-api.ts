import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';

const PAGE_SIZE = 10;

export type PatientBooking = ResponseOf<'/api/patient/bookings', 'get'>['items'][number];

export interface BookingListParams {
  scope: 'upcoming' | 'past';
  page: number;
}

export const bookingsApi = {
  list: ({ scope, page }: BookingListParams, signal: AbortSignal) =>
    apiFetch('get', '/api/patient/bookings', {
      query: { scope, page, pageSize: PAGE_SIZE },
      signal,
    }),
  cancel: (id: string, startsAt: string, reason: string) =>
    apiFetch('post', '/api/appointments/{id}/cancel', {
      params: { id },
      body: { startsAt, ...(reason && { reason }) },
    }),
};
