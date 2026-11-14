import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { useCurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import { userLocks } from './user-cache';
import { usersApi } from './users-api';

export function useUserDetail() {
  const id = useParams().id ?? '';
  const currentUser = useCurrentUser();
  const query = useQuery({
    queryKey: queryKeys.adminUsers.detail(id),
    queryFn: ({ signal }) => usersApi.detail(id, signal),
  });
  return { id, query, locks: query.data ? userLocks(query.data, currentUser.id) : undefined };
}
