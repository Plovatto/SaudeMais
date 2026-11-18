import { queryOptions } from '@tanstack/react-query';
import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';
import { queryKeys } from '@lib/query-keys';

const PATH = '/api/doctor/schedule';
const TIME_OFF = '/api/doctor/time-off';

export type DoctorSchedule = ResponseOf<typeof PATH, 'get'>;
export type ScheduleBody = BodyOf<typeof PATH, 'put'>;
export type ScheduleWarning = ResponseOf<typeof PATH, 'put'>['warnings'][number];
export type UnitHours = DoctorSchedule['unitHours'];
export type DurationMin = NonNullable<ScheduleBody['appointmentDurationMin']>;
export type TimeOff = ResponseOf<typeof TIME_OFF, 'get'>[number];
export type TimeOffBody = BodyOf<typeof TIME_OFF, 'post'>;

export const scheduleApi = {
  get: (signal: AbortSignal) => apiFetch('get', PATH, { signal }),
  save: (body: ScheduleBody) => apiFetch('put', PATH, { body }),
};

export const timeOffApi = {
  list: (signal: AbortSignal) => apiFetch('get', TIME_OFF, { signal }),
  create: (body: TimeOffBody) => apiFetch('post', TIME_OFF, { body }),
  remove: (date: string) => apiFetch('delete', `${TIME_OFF}/{date}`, { params: { date } }),
};

export const timeOffQuery = queryOptions({
  queryKey: queryKeys.doctorTimeOff,
  queryFn: ({ signal }) => timeOffApi.list(signal),
});
