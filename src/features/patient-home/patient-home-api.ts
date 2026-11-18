import { queryOptions } from '@tanstack/react-query';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import { queryKeys } from '@lib/query-keys';

export type PatientHome = ResponseOf<'/api/patient/home', 'get'>;

export type ResultSummary = ResponseOf<'/api/patient/exam-results', 'get'>['items'][number];

const RECENT_RESULTS = 3;

export { patientHomeQuery } from '@lib/api/home-api';

export const recentResultsQuery = queryOptions({
  queryKey: queryKeys.patient.examResults({ page: 1, pageSize: RECENT_RESULTS }),
  queryFn: ({ signal }) =>
    apiFetch('get', '/api/patient/exam-results', { query: { page: 1, pageSize: RECENT_RESULTS }, signal }),
});
