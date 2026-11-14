import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import type { AdminUserDetail } from './users-api';

export const ADMIN_USERS_PATH = '/admin/usuarios';

export function syncUser(queryClient: QueryClient, user: AdminUserDetail) {
  queryClient.setQueryData(queryKeys.adminUsers.detail(user.id), user);
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.lists });
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.impact(user.id) });
}

export interface UserLocks {
  isProtected: boolean;
  isInactive: boolean;
  isSelf: boolean;
}

export const userLocks = (
  user: { id: string; isProtected: boolean; deactivatedAt: string | null },
  currentUserId: string,
): UserLocks => ({
  isProtected: user.isProtected,
  isInactive: user.deactivatedAt !== null,
  isSelf: user.id === currentUserId,
});
