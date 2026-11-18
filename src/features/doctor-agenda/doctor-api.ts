import { queryOptions } from '@tanstack/react-query';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import type { DoctorAppointment, HealthMetricsInput } from '@lib/api/models';
import { civilDateInSaoPaulo } from '@lib/date';
import { queryKeys } from '@lib/query-keys';

const PAGE_SIZE = 10;

const DAY_LIMIT = 50;

export type DoctorHome = ResponseOf<'/api/doctor/home', 'get'>;

export type AgendaTab = keyof DoctorHome['counts'];

export interface AgendaParams {
  tab: AgendaTab;
  page: number;
  from?: string;
  pageSize?: number;
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
  list: ({ tab, page, from, pageSize = PAGE_SIZE }: AgendaParams, signal: AbortSignal) =>
    apiFetch('get', '/api/doctor/appointments', {
      query: { tab, page, pageSize, ...(from && { from }) },
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
  });
};

const DAY_TABS: readonly AgendaTab[] = ['history', 'confirmed', 'pending'];

const ON_AGENDA: ReadonlySet<DoctorAppointment['status']> = new Set([
  'pending',
  'confirmed',
  'completed',
  'no_show',
]);

const listDay = async (day: string, signal: AbortSignal) => {
  const lists = await Promise.all(
    DAY_TABS.map((tab) => doctorApi.list({ tab, page: 1, from: day, pageSize: DAY_LIMIT }, signal)),
  );
  return lists
    .flatMap(({ items }) => items)
    .filter(
      ({ status, startsAt }) => ON_AGENDA.has(status) && civilDateInSaoPaulo(new Date(startsAt)) === day,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
};

export const dayAgendaQuery = (day: string) =>
  queryOptions({
    queryKey: queryKeys.doctor.appointments({ day }),
    queryFn: ({ signal }) => listDay(day, signal),
  });
