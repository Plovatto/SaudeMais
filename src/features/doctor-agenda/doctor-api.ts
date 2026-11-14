import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';

const PAGE_SIZE = 10;

export type DoctorHome = ResponseOf<'/api/doctor/home', 'get'>;

export type DoctorAppointment = DoctorHome['pending'][number];

export type AgendaTab = keyof DoctorHome['counts'];

export interface AgendaParams {
  tab: AgendaTab;
  page: number;
}

export const doctorApi = {
  home: (signal: AbortSignal) => apiFetch('get', '/api/doctor/home', { signal }),
  list: ({ tab, page }: AgendaParams, signal: AbortSignal) =>
    apiFetch('get', '/api/doctor/appointments', { query: { tab, page, pageSize: PAGE_SIZE }, signal }),
  confirm: ({ id, startsAt }: DoctorAppointment) =>
    apiFetch('post', '/api/appointments/{id}/confirm', { params: { id }, body: { startsAt } }),
};
