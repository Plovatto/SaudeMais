import type { ReactNode } from 'react';
import { PageHeader } from '@components/layout/PageHeader';
import { FormAlert, QueryError, Skeleton } from '@components/ui';
import type { UserLocks } from './user-cache';
import { userMessages } from './user-messages';
import type { AdminUserDetail } from './users-api';
import { useUserDetail } from './useUserDetail';

export interface UserDetailGateProps {
  title: string;
  backFallback: (id: string) => string;
  children: (user: AdminUserDetail, locks: UserLocks) => ReactNode;
}

function lockNotice({ isProtected, isInactive }: UserLocks) {
  if (isProtected) return 'Esta é uma conta de demonstração. Os dados podem ser vistos, mas não alterados.';
  if (isInactive) return 'Esta conta está desativada. Reative-a para alterar dados e perfis.';
  return null;
}

export function UserDetailGate({ title, backFallback, children }: UserDetailGateProps) {
  const { id, query, locks } = useUserDetail();
  const notice = locks && lockNotice(locks);
  return (
    <>
      <PageHeader title={title} back backFallback={backFallback(id)} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {query.isPending && (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-32" />
          </div>
        )}
        {query.isError && (
          <QueryError error={query.error} messages={userMessages} onRetry={() => void query.refetch()} />
        )}
        {notice && (
          <FormAlert tone="warning" role="note">
            {notice}
          </FormAlert>
        )}
        {query.data && locks && children(query.data, locks)}
      </div>
    </>
  );
}
