import { apiFetch } from '@lib/api/api-fetch';

const PAGE_SIZE = 10;

export const listPatientResults = (patientId: string, page: number, signal: AbortSignal) =>
  apiFetch('get', '/api/doctor/patients/{patientId}/exam-results', {
    params: { patientId },
    query: { page, pageSize: PAGE_SIZE },
    signal,
  });
