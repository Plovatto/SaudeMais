import type { QueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import type { AdminUserDetail } from './users-api';

function refreshTotals(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.lists });
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminHome });
}

export function refreshUser(queryClient: QueryClient, id: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.detail(id) });
  refreshTotals(queryClient);
}

export function syncUser(queryClient: QueryClient, user: AdminUserDetail) {
  queryClient.setQueryData(queryKeys.adminUsers.detail(user.id), user);
  refreshTotals(queryClient);
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.impact(user.id) });
  if (queryClient.getQueryData<CurrentUser>(queryKeys.session)?.id === user.id)
    void queryClient.invalidateQueries({ queryKey: queryKeys.session });
}

export interface UserLocks {
  isInactive: boolean;
  isSelf: boolean;
}

export const userLocks = (
  user: { id: string; deactivatedAt: string | null },
  currentUserId: string,
): UserLocks => ({
  isInactive: user.deactivatedAt !== null,
  isSelf: user.id === currentUserId,
});
