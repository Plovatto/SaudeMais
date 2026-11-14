import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import type { UserNotification } from '@lib/api/models';

type PatientHome = Omit<ResponseOf<'/api/patient/home', 'get'>, 'lastNotification'> & {
  lastNotification: UserNotification | null;
};

export const fetchPatientHome = (signal: AbortSignal) =>
  apiFetch('get', '/api/patient/home', { signal }) as Promise<PatientHome>;

export const markNotificationRead = (id: string) =>
  apiFetch('post', '/api/notifications/{id}/read', { params: { id } });
