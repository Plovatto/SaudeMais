import { queryOptions, useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { apiFetch, type ResponseOf } from '@lib/api/api-fetch';
import { isUnauthenticated } from '@lib/api/api-error';
import { queryKeys } from '@lib/query-keys';
import { sessionEndReason, sessionToken, subscribeSession, type SessionEndReason } from './session';

export type CurrentUser = ResponseOf<'/api/me', 'get'>;

export type SessionState =
  | { status: 'anonymous'; ended: SessionEndReason | null }
  | { status: 'loading' }
  | { status: 'unreachable'; retry: () => void }
  | { status: 'authenticated'; user: CurrentUser };

export const sessionQuery = queryOptions({
  queryKey: queryKeys.session,
  queryFn: ({ signal }) => apiFetch('get', '/api/me', { signal }),
  staleTime: Number.POSITIVE_INFINITY,
});

export function useSession(): SessionState {
  const token = useSyncExternalStore(subscribeSession, sessionToken);
  const query = useQuery({ ...sessionQuery, enabled: token !== null });
  if (token === null) return { status: 'anonymous', ended: sessionEndReason() };
  if (query.data) return { status: 'authenticated', user: query.data };
  if (query.error) {
    if (isUnauthenticated(query.error)) return { status: 'anonymous', ended: 'expired' };
    return { status: 'unreachable', retry: () => void query.refetch() };
  }
  return { status: 'loading' };
}

export function useCurrentUser(): CurrentUser {
  const session = useSession();
  if (session.status !== 'authenticated') throw new Error('useCurrentUser needs an authenticated session');
  return session.user;
}
