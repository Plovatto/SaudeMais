import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { apiFetch } from './api-fetch';

export const doctorHomeQuery = queryOptions({
  queryKey: queryKeys.doctor.home,
  queryFn: ({ signal }) => apiFetch('get', '/api/doctor/home', { signal }),
});

export const patientHomeQuery = queryOptions({
  queryKey: queryKeys.patient.home,
  queryFn: ({ signal }) => apiFetch('get', '/api/patient/home', { signal }),
});
