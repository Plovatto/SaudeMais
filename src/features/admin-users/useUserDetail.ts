import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import { userLocks } from './user-cache';
import { usersApi } from './users-api';

export function useUserDetail(id: string) {
  const currentUser = useCurrentUser();
  const query = useQuery({
    queryKey: queryKeys.adminUsers.detail(id),
    queryFn: ({ signal }) => usersApi.detail(id, signal),
    enabled: id !== '',
  });
  return { query, locks: query.data ? userLocks(query.data, currentUser.id) : undefined };
}
