import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import type { DoctorAppointment } from '@lib/api/models';

const PAGE_SIZE = 10;

export type DoctorHome = ResponseOf<'/api/doctor/home', 'get'>;

export type AgendaTab = keyof DoctorHome['counts'];

export interface AgendaParams {
  tab: AgendaTab;
  page: number;
}

type DecisionPath = `/api/appointments/{id}/${'confirm' | 'complete' | 'no-show'}`;

const decide =
  (path: DecisionPath) =>
  ({ id, startsAt }: DoctorAppointment) =>
    apiFetch('post', path, { params: { id }, body: { startsAt } });

export const doctorApi = {
  home: (signal: AbortSignal) => apiFetch('get', '/api/doctor/home', { signal }),
  list: ({ tab, page }: AgendaParams, signal: AbortSignal) =>
    apiFetch('get', '/api/doctor/appointments', { query: { tab, page, pageSize: PAGE_SIZE }, signal }),
  confirm: decide('/api/appointments/{id}/confirm'),
  complete: decide('/api/appointments/{id}/complete'),
  noShow: decide('/api/appointments/{id}/no-show'),
};
