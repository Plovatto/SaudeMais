import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode, RefObject } from 'react';
import { Card, Pagination, QueryError, Skeleton } from '@components/ui';
import type { PageMeta } from '@hooks/usePageParam';

interface PagedList<Item> {
  query: UseQueryResult<PageMeta>;
  items: Item[] | undefined;
  page: number;
  lastPage: number;
  setPage: (page: number) => void;
}

export interface PagedResultsProps<Item> {
  list: PagedList<Item>;
  found: (total: number) => string;
  resultsRef: RefObject<HTMLParagraphElement | null>;
  empty: ReactNode;
  children: (items: Item[]) => ReactNode;
  footer?: ReactNode;
  bare?: boolean;
}

export function PagedResults<Item>({
  list: { query, items, page, lastPage, setPage },
  found,
  resultsRef,
  empty,
  children,
  footer,
  bare = false,
}: PagedResultsProps<Item>) {
  const total = items && query.data ? query.data.total : 0;

  return (
    <>
      <p
        ref={resultsRef}
        tabIndex={-1}
        aria-live="polite"
        className="text-text-secondary text-sm focus-visible:outline-none"
      >
        {total > 0 ? found(total) : null}
      </p>
      {query.isPending && (
        <div aria-busy="true" className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      )}
      {query.isError && <QueryError error={query.error} onRetry={() => void query.refetch()} />}
      {items?.length === 0 && (bare ? empty : <Card>{empty}</Card>)}
      {items && items.length > 0 && (
        <>
          {bare ? children(items) : <Card className="p-4 sm:p-6">{children(items)}</Card>}
          <Pagination page={page} totalPages={lastPage} onPageChange={(next) => setPage(next)} />
          {footer}
        </>
      )}
    </>
  );
}
