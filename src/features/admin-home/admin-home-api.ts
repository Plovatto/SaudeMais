import { apiFetch } from '@lib/api/api-fetch';

export const fetchAdminHome = (signal: AbortSignal) => apiFetch('get', '/api/admin/home', { signal });
