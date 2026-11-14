import { queryOptions, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Role } from '@constants/areas';
import { queryKeys } from '@lib/query-keys';
import { apiFetch, type ResponseOf } from './api-fetch';
import type { UserNotification } from './models';

const POLL_INTERVAL_MS = 120_000;
const COUNT_STALE_MS = 60_000;

export const unreadCountQuery = (role: Role) =>
  queryOptions({
    queryKey: queryKeys.notifications.unread(role),
    queryFn: ({ signal }) => apiFetch('get', '/api/notifications/unread-count', { query: { role }, signal }),
    select: ({ count }) => count,
    staleTime: COUNT_STALE_MS,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

export type NotificationPage = ResponseOf<'/api/notifications', 'get'>;

export const notificationsQuery = (role: Role, page: number, pageSize: number) =>
  queryOptions({
    queryKey: queryKeys.notifications.list({ role, page, pageSize }),
    queryFn: ({ signal }) =>
      apiFetch('get', '/api/notifications', { query: { role, page, pageSize }, signal }),
    placeholderData: (previous: NotificationPage | undefined, previousQuery) =>
      (previousQuery?.queryKey[2] as { role?: Role } | undefined)?.role === role ? previous : undefined,
  });

export const markAllNotificationsRead = (role: Role) =>
  apiFetch('post', '/api/notifications/read-all', { query: { role } });

export const invalidateNotifications = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.patient.home }),
  ]);

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useCallback(
    ({ id, readAt }: UserNotification) => {
      if (readAt !== null) return;
      void apiFetch('post', '/api/notifications/{id}/read', { params: { id } }).then(
        () => invalidateNotifications(queryClient),
        () => undefined,
      );
    },
    [queryClient],
  );
}
