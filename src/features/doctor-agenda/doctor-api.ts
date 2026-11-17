import { queryOptions } from '@tanstack/react-query';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import type { DoctorAppointment, HealthMetricsInput } from '@lib/api/models';
import { queryKeys } from '@lib/query-keys';

const PAGE_SIZE = 10;

export type DoctorHome = ResponseOf<'/api/doctor/home', 'get'>;

export type AgendaTab = keyof DoctorHome['counts'];

export interface AgendaParams {
  tab: AgendaTab;
  page: number;
}

type DecisionPath = `/api/appointments/{id}/${'confirm' | 'no-show'}`;

const decide =
  (path: DecisionPath) =>
  ({ id, startsAt }: DoctorAppointment) =>
    apiFetch('post', path, { params: { id }, body: { startsAt } });

export const doctorHomeQuery = queryOptions({
  queryKey: queryKeys.doctor.home,
  queryFn: ({ signal }) => apiFetch('get', '/api/doctor/home', { signal }),
});

export const doctorApi = {
  list: ({ tab, page }: AgendaParams, signal: AbortSignal) =>
    apiFetch('get', '/api/doctor/appointments', { query: { tab, page, pageSize: PAGE_SIZE }, signal }),
  confirm: decide('/api/appointments/{id}/confirm'),
  complete: ({ id, startsAt }: DoctorAppointment, metrics?: HealthMetricsInput) =>
    apiFetch('post', '/api/appointments/{id}/complete', {
      params: { id },
      body: { startsAt, ...(metrics && { metrics }) },
    }),
  noShow: decide('/api/appointments/{id}/no-show'),
};
