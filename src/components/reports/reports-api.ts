import { apiDownload, apiFetch, type ResponseOf } from '@lib/api/api-fetch';

export type AdminReport = ResponseOf<'/api/admin/reports', 'get'>;

export type ReportFormat = 'pdf' | 'xlsx';

export interface Period {
  from: string;
  to: string;
}

const EXPORT_TIMEOUT_MS = 60_000;

const periodQuery = ({ from, to }: Period) => ({ from: from || undefined, to: to || undefined });

export const fetchAdminReport = (period: Period, signal: AbortSignal) =>
  apiFetch('get', '/api/admin/reports', { query: periodQuery(period), signal });

export const downloadAdminReport = (period: Period, format: ReportFormat, signal: AbortSignal) =>
  apiDownload('/api/admin/reports/export', {
    query: { ...periodQuery(period), format },
    signal,
    timeoutMs: EXPORT_TIMEOUT_MS,
  });
