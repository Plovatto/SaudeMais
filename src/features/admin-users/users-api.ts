import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

export const USERS_PAGE_SIZE = 20;

export type AdminUser = ResponseOf<'/api/admin/users', 'get'>['items'][number];
export type AdminUserDetail = ResponseOf<'/api/admin/users/{id}', 'get'>;
export type DeactivationImpact = ResponseOf<'/api/admin/users/{id}/deactivation-impact', 'get'>;
export type DoctorProfileInput = BodyOf<'/api/admin/users/{id}/doctor-profile', 'post'>;
export type UserRoleFilter = 'patient' | 'doctor' | '';
export type UserStatusFilter = 'active' | 'inactive' | '';

export interface UserListParams {
  page: number;
  search: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
}

const user = (id: string) => ({ params: { id } });

export const usersApi = {
  list: ({ page, search, role, status }: UserListParams, signal: AbortSignal) =>
    apiFetch('get', '/api/admin/users', {
      query: {
        page,
        pageSize: USERS_PAGE_SIZE,
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
      },
      signal,
    }),
  detail: (id: string, signal: AbortSignal) =>
    apiFetch('get', '/api/admin/users/{id}', { ...user(id), signal }),
  update: (id: string, body: BodyOf<'/api/admin/users/{id}', 'patch'>) =>
    apiFetch('patch', '/api/admin/users/{id}', { ...user(id), body }),
  impact: (id: string, signal: AbortSignal) =>
    apiFetch('get', '/api/admin/users/{id}/deactivation-impact', { ...user(id), signal }),
  deactivate: (id: string) => apiFetch('post', '/api/admin/users/{id}/deactivate', user(id)),
  reactivate: (id: string) => apiFetch('post', '/api/admin/users/{id}/reactivate', user(id)),
  sendPasswordReset: (id: string) => apiFetch('post', '/api/admin/users/{id}/password-reset', user(id)),
  grantAdmin: (id: string) =>
    apiFetch('post', '/api/admin/users/{id}/roles/{role}', { params: { id, role: 'admin' } }),
  revokeAdmin: (id: string) =>
    apiFetch('delete', '/api/admin/users/{id}/roles/{role}', { params: { id, role: 'admin' } }),
  createDoctorProfile: (id: string, body: DoctorProfileInput) =>
    apiFetch('post', '/api/admin/users/{id}/doctor-profile', { ...user(id), body }),
  updateDoctorProfile: (id: string, body: BodyOf<'/api/admin/users/{id}/doctor-profile', 'patch'>) =>
    apiFetch('patch', '/api/admin/users/{id}/doctor-profile', { ...user(id), body }),
  removeDoctorProfile: (id: string) => apiFetch('delete', '/api/admin/users/{id}/doctor-profile', user(id)),
};

export const catalogApi = {
  specialties: (signal: AbortSignal) => apiFetch('get', '/api/specialties', { signal }),
  units: (signal: AbortSignal) => apiFetch('get', '/api/units', { signal }),
};
