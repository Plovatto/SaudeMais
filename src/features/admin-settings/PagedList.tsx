import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ListSkeleton, Pagination, QueryError } from '@components/ui';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import type { Page } from '@lib/api/page';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';
import { SettingsFooter } from './SettingsCard';

export interface PagedListProps<T> {
  param: string;
  label: string;
  queryKey: QueryKey;
  load: (page: number, signal: AbortSignal) => Promise<Page<T>>;
  messages: MessageOverrides;
  footer: ReactNode;
  children: (items: readonly T[]) => ReactNode;
}

export function PagedList<T>({
  param,
  label,
  queryKey,
  load,
  messages,
  footer,
  children,
}: PagedListProps<T>) {
  const [page, setPage] = usePageParam(param);
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: ({ signal }) => load(page, signal),
    placeholderData: keepPreviousData,
  });
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);

  return (
    <>
      {query.isPending && <ListSkeleton />}
      {query.isError && (
        <QueryError padded error={query.error} messages={messages} onRetry={() => void query.refetch()} />
      )}
      {query.data && !outOfRange && children(query.data.items)}
      <SettingsFooter>
        {footer}
        <Pagination
          label={label}
          page={page}
          totalPages={query.data ? lastPage : 0}
          onPageChange={(next) => setPage(next)}
        />
      </SettingsFooter>
    </>
  );
}
