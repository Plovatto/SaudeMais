import { apiFetch } from '@lib/api/api-fetch';
import type { PatientBooking } from '@lib/api/models';

const PAGE_SIZE = 10;

export interface BookingListParams {
  scope: 'upcoming' | 'past';
  page: number;
  kind?: PatientBooking['kind'] | undefined;
  status?: PatientBooking['status'] | undefined;
}

export const listBookings = ({ scope, page, kind, status }: BookingListParams, signal: AbortSignal) =>
  apiFetch('get', '/api/patient/bookings', {
    query: { scope, page, pageSize: PAGE_SIZE, kind, status },
    signal,
  });
