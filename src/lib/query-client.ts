import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@lib/api/api-error';
import { endSession } from '@lib/auth/session';

const MAX_RETRIES = 2;
const MAX_TIMEOUT_RETRIES = 1;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === 'TIMEOUT') return failureCount < MAX_TIMEOUT_RETRIES;
  return failureCount < MAX_RETRIES && (error.code === 'NETWORK_ERROR' || error.status >= 500);
}

function expireOnUnauthenticated(error: unknown): void {
  if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') endSession('expired');
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: expireOnUnauthenticated }),
    mutationCache: new MutationCache({ onError: expireOnUnauthenticated }),
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}
