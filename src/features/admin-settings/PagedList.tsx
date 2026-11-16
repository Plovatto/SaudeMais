import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Pagination, QueryError, Skeleton } from '@components/ui';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import type { Page } from '@lib/api/page';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';

export interface PagedListProps<T> {
  queryKey: QueryKey;
  load: (page: number, signal: AbortSignal) => Promise<Page<T>>;
  messages: MessageOverrides;
  children: (items: readonly T[] | undefined) => ReactNode;
}

export function PagedList<T>({ queryKey, load, messages, children }: PagedListProps<T>) {
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: ({ signal }) => load(page, signal),
    placeholderData: keepPreviousData,
  });
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);

  return (
    <>
      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      )}
      {query.isError && (
        <QueryError error={query.error} messages={messages} onRetry={() => void query.refetch()} />
      )}
      {!outOfRange && children(query.data?.items)}
      <Pagination page={page} totalPages={query.data ? lastPage : 0} onPageChange={(next) => setPage(next)} />
    </>
  );
}
