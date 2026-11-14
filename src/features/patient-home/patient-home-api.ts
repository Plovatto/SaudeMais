import { apiFetch } from '@lib/api/api-fetch';

export const fetchPatientHome = (signal: AbortSignal) => apiFetch('get', '/api/patient/home', { signal });
