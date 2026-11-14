import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';

export const BOOKINGS_PAGE_SIZE = 10;

export type BookingScope = 'upcoming' | 'past';
export type PatientBooking = ResponseOf<'/api/patient/bookings', 'get'>['items'][number];

export interface BookingListParams {
  scope: BookingScope;
  page: number;
}

export const bookingsApi = {
  list: ({ scope, page }: BookingListParams, signal: AbortSignal) =>
    apiFetch('get', '/api/patient/bookings', {
      query: { scope, page, pageSize: BOOKINGS_PAGE_SIZE },
      signal,
    }),
  cancel: (id: string, startsAt: string, reason: string) =>
    apiFetch('post', '/api/appointments/{id}/cancel', {
      params: { id },
      body: { startsAt, ...(reason && { reason }) },
    }),
};
