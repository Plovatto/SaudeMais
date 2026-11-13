import { queryOptions, useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import { ApiError } from '@lib/api/api-error';
import { queryKeys } from '@lib/query-keys';
import { sessionExpired, sessionToken, subscribeSession } from './session';

export type CurrentUser = ResponseOf<'/api/me', 'get'>;

export type SessionState =
  | { status: 'anonymous'; expired: boolean }
  | { status: 'loading' }
  | { status: 'unreachable'; retry: () => void }
  | { status: 'authenticated'; user: CurrentUser };

export const sessionQuery = queryOptions({
  queryKey: queryKeys.session,
  queryFn: ({ signal }) => apiFetch('get', '/api/me', { signal }),
  staleTime: Number.POSITIVE_INFINITY,
});

const isUnauthenticated = (error: unknown) => error instanceof ApiError && error.status === 401;

export function useSession(): SessionState {
  const token = useSyncExternalStore(subscribeSession, sessionToken);
  const query = useQuery({ ...sessionQuery, enabled: token !== null });
  if (token === null) return { status: 'anonymous', expired: sessionExpired() };
  if (query.data) return { status: 'authenticated', user: query.data };
  if (query.error) {
    if (isUnauthenticated(query.error)) return { status: 'anonymous', expired: true };
    return { status: 'unreachable', retry: () => void query.refetch() };
  }
  return { status: 'loading' };
}

export function useCurrentUser(): CurrentUser {
  const session = useSession();
  if (session.status !== 'authenticated') throw new Error('useCurrentUser needs an authenticated session');
  return session.user;
}
