import { queryOptions } from '@tanstack/react-query';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import { queryKeys } from '@lib/query-keys';

export type PatientHome = ResponseOf<'/api/patient/home', 'get'>;

export const patientHomeQuery = queryOptions({
  queryKey: queryKeys.patient.home,
  queryFn: ({ signal }) => apiFetch('get', '/api/patient/home', { signal }),
});
