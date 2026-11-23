import { queryOptions } from '@tanstack/react-query';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import { fetchAllPages } from '@lib/api/page';
import type { DoctorAppointment, HealthMetricsInput } from '@lib/api/models';
import { MINUTE_MS } from '@lib/date';
import { queryKeys } from '@lib/query-keys';

const PAGE_SIZE = 10;

const RANGE_LIMIT = 50;

export type DoctorHome = ResponseOf<'/api/doctor/home', 'get'>;

export type AgendaTab = keyof DoctorHome['counts'];

export interface AgendaParams {
  tab: AgendaTab | 'all';
  page: number;
  from?: string;
  to?: string;
  search?: string;
  pageSize?: number;
}

type DecisionPath = `/api/appointments/{id}/${'confirm' | 'no-show'}`;

const decide =
  (path: DecisionPath) =>
  ({ id, startsAt }: DoctorAppointment) =>
    apiFetch('post', path, { params: { id }, body: { startsAt } });

export const doctorApi = {
  list: ({ tab, page, from, to, search, pageSize = PAGE_SIZE }: AgendaParams, signal: AbortSignal) =>
    apiFetch('get', '/api/doctor/appointments', {
      query: { tab, page, pageSize, ...(from && { from }), ...(to && { to }), ...(search && { search }) },
      signal,
    }),
  confirm: decide('/api/appointments/{id}/confirm'),
  complete: ({ id, startsAt }: DoctorAppointment, metrics?: HealthMetricsInput) =>
    apiFetch('post', '/api/appointments/{id}/complete', {
      params: { id },
      body: { startsAt, ...(metrics && { metrics }) },
    }),
  noShow: decide('/api/appointments/{id}/no-show'),
};

export const nextAppointmentQuery = (today: string) => {
  const params: AgendaParams = { tab: 'confirmed', page: 1, from: today, pageSize: 1 };
  return queryOptions({
    queryKey: queryKeys.doctor.appointments(params),
    queryFn: ({ signal }) => doctorApi.list(params, signal),
    select: ({ items }) => items[0] ?? null,
    refetchInterval: MINUTE_MS,
  });
};

const ON_AGENDA: ReadonlySet<DoctorAppointment['status']> = new Set([
  'pending',
  'confirmed',
  'completed',
  'no_show',
]);

const listRange = async (from: string, to: string, signal: AbortSignal) => {
  const items = await fetchAllPages((page) =>
    doctorApi.list({ tab: 'all', page, from, to, pageSize: RANGE_LIMIT }, signal),
  );
  return items.filter(({ status }) => ON_AGENDA.has(status));
};

export const agendaRangeQuery = (from: string, to = from) =>
  queryOptions({
    queryKey: queryKeys.doctor.range(from, to),
    refetchInterval: MINUTE_MS,
    queryFn: ({ signal }) => listRange(from, to, signal),
  });
