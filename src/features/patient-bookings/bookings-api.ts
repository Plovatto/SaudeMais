import { apiFetch } from '@lib/api/api-fetch';

const PAGE_SIZE = 10;

export interface BookingListParams {
  scope: 'upcoming' | 'past';
  page: number;
}

export const listBookings = ({ scope, page }: BookingListParams, signal: AbortSignal) =>
  apiFetch('get', '/api/patient/bookings', {
    query: { scope, page, pageSize: PAGE_SIZE },
    signal,
  });
