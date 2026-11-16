import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';

export type AdminReport = ResponseOf<'/api/admin/reports', 'get'>;

export interface Period {
  from: string;
  to: string;
}

export const fetchAdminReport = ({ from, to }: Period, signal: AbortSignal) =>
  apiFetch('get', '/api/admin/reports', { query: { from: from || undefined, to: to || undefined }, signal });
