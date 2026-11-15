import { apiFetch } from './api-fetch';

export const cancelAppointment = (id: string, startsAt: string, reason: string) =>
  apiFetch('post', '/api/appointments/{id}/cancel', {
    params: { id },
    body: { startsAt, ...(reason && { reason }) },
  });
