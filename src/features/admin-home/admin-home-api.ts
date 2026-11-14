import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';

export type AdminHome = ResponseOf<'/api/admin/home', 'get'>;

export const fetchAdminHome = (signal: AbortSignal) => apiFetch('get', '/api/admin/home', { signal });
