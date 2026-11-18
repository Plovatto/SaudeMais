import { useEffect, useRef, useState } from 'react';
import { SEARCH_DELAY_MS, useDebouncedValue } from './useDebouncedValue';
import { resetPageAnd } from './usePageParam';
import { useSearchParam } from './useSearchParam';

const NO_RESET: readonly string[] = [];

export function useSearchDraft(name: string, resetKeys: readonly string[] = NO_RESET) {
  const written = useRef<string | null>(null);
  const settled = useRef<string | null>(null);
  const [searchParam, setSearchParam] = useSearchParam(name);
  const [search, setSearch] = useState(searchParam);
  const debounced = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);

  useEffect(() => {
    if (written.current === null) written.current = searchParam;
    else if (searchParam !== written.current) {
      written.current = searchParam;
      setSearch(searchParam);
    }
  }, [searchParam]);

  useEffect(() => {
    if (settled.current === null || debounced === settled.current) {
      settled.current = debounced;
      return;
    }
    settled.current = debounced;
    if (debounced === written.current) return;
    written.current = debounced;
    setSearchParam(debounced, resetPageAnd(resetKeys));
  }, [debounced, setSearchParam, resetKeys]);

  return { search, setSearch, searchParam };
}
