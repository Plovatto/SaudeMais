import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@lib/api/api-error';

const MAX_RETRIES = 2;
const TRANSIENT_CODES = new Set(['NETWORK_ERROR', 'TIMEOUT']);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !(error instanceof ApiError)) return false;
  return TRANSIENT_CODES.has(error.code) || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}
