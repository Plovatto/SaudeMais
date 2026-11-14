import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

const PATH = '/api/doctor/schedule';

export type DoctorSchedule = ResponseOf<typeof PATH, 'get'>;
export type ScheduleWarning = ResponseOf<typeof PATH, 'put'>['warnings'][number];
export type UnitHours = DoctorSchedule['unitHours'];

export const scheduleApi = {
  get: (signal: AbortSignal) => apiFetch('get', PATH, { signal }),
  save: (body: BodyOf<typeof PATH, 'put'>) => apiFetch('put', PATH, { body }),
};
