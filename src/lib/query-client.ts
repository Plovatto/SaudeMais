import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, isUnauthenticated } from '@lib/api/api-error';
import { endSession, sessionToken, subscribeSession } from '@lib/auth/session';

const MAX_RETRIES = 2;
const MAX_TIMEOUT_RETRIES = 1;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === 'TIMEOUT') return failureCount < MAX_TIMEOUT_RETRIES;
  return failureCount < MAX_RETRIES && (error.code === 'NETWORK_ERROR' || error.status >= 500);
}

function expireOnUnauthenticated(error: unknown): void {
  if (isUnauthenticated(error)) endSession('expired', error.token);
}

export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    queryCache: new QueryCache({ onError: expireOnUnauthenticated }),
    mutationCache: new MutationCache({ onError: expireOnUnauthenticated }),
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
  let token = sessionToken();
  subscribeSession(() => {
    const next = sessionToken();
    if (next === token) return;
    token = next;
    client.clear();
  });
  return client;
}
