import { useCallback, useEffect } from 'react';
import { useSearchParam } from './useSearchParam';

export interface PageMeta {
  total: number;
  pageSize: number;
}

export function usePageParam() {
  const [raw, setRaw] = useSearchParam('pagina', '1');
  const page = Math.max(1, Math.trunc(Number(raw)) || 1);
  const setPage = useCallback(
    (next: number, options?: { replace?: boolean }) => setRaw(String(next), options),
    [setRaw],
  );
  return [page, setPage] as const;
}

export function useClampedPage(
  page: number,
  setPage: (next: number, options?: { replace?: boolean }) => void,
  meta: PageMeta | undefined,
) {
  const lastPage = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;
  const outOfRange = meta !== undefined && page > lastPage;
  useEffect(() => {
    if (outOfRange) setPage(lastPage, { replace: true });
  }, [outOfRange, lastPage, setPage]);
  return { lastPage, outOfRange };
}
