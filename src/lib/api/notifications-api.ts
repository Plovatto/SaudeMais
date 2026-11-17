import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Role } from '@constants/areas';
import { queryKeys } from '@lib/query-keys';
import { apiFetch, type ResponseOf } from './api-fetch';
import type { UserNotification } from './models';

export const unreadCountQuery = (role: Role) =>
  queryOptions({
    queryKey: queryKeys.notifications.unread(role),
    queryFn: ({ signal }) => apiFetch('get', '/api/notifications/unread-count', { query: { role }, signal }),
    select: ({ count }) => count,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

const POLL_INTERVAL_MS = 120_000;

export const useUnreadCount = (role: Role): number | undefined =>
  useQuery({
    ...unreadCountQuery(role),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  }).data;

export const unreadText = (count: number) => (count === 1 ? '1 não lida' : `${count} não lidas`);

export type NotificationPage = ResponseOf<'/api/notifications', 'get'>;

export const notificationsQuery = (role: Role, page: number, pageSize: number) =>
  queryOptions({
    queryKey: queryKeys.notifications.list(role, { page, pageSize }),
    queryFn: ({ signal }) =>
      apiFetch('get', '/api/notifications', { query: { role, page, pageSize }, signal }),
    placeholderData: (previous: NotificationPage | undefined, previousQuery) =>
      previousQuery?.queryKey[2] === role ? previous : undefined,
  });

export const markAllNotificationsRead = (role: Role) =>
  apiFetch('post', '/api/notifications/read-all', { query: { role } });

export const invalidateNotifications = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.patient.home }),
    queryClient.invalidateQueries({ queryKey: queryKeys.doctor.home }),
  ]);

const markNotificationRead = (id: string) =>
  apiFetch('post', '/api/notifications/{id}/read', { params: { id } });

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => invalidateNotifications(queryClient),
  });
  return useCallback(
    ({ id, readAt }: UserNotification) => {
      if (readAt === null) mutate(id);
    },
    [mutate],
  );
}
