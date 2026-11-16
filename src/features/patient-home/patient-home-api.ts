import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';

export type PatientHome = ResponseOf<'/api/patient/home', 'get'>;

export const fetchPatientHome = (signal: AbortSignal) => apiFetch('get', '/api/patient/home', { signal });
