import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { TAB_PARAM } from '@constants/areas';
import { resetPageAnd, useClampedPage, usePageParam, type PageMeta } from './usePageParam';
import { useSearchParam } from './useSearchParam';

interface ListPage extends PageMeta {
  items: unknown[];
}

type TabList = readonly [{ value: string }, ...{ value: string }[]];

interface ListSource<Result> {
  queryKey: QueryKey;
  queryFn: (signal: AbortSignal) => Promise<Result>;
}

export function useTabbedList<Tabs extends TabList, Result extends ListPage>(
  tabs: Tabs,
  source: (tab: Tabs[number], page: number) => ListSource<Result>,
  resetOnTab: readonly string[] = [],
  tabParamName = TAB_PARAM,
) {
  const [page, setPage] = usePageParam();
  const [tabParam, setTabParam] = useSearchParam(tabParamName, tabs[0].value);
  const tab: Tabs[number] = tabs.find((item) => item.value === tabParam) ?? tabs[0];
  const { queryKey, queryFn } = source(tab, page);
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn(signal),
    meta: { tab: tab.value },
    placeholderData: (previous, previousQuery) =>
      previousQuery?.meta?.tab === tab.value ? previous : undefined,
  });
  const [lastData, setLastData] = useState(query.data);
  if (query.data && query.data !== lastData) setLastData(query.data);
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);
  const items: Result['items'] | undefined = outOfRange ? undefined : query.data?.items;

  return {
    tab,
    selectTab: (value: string) => setTabParam(value, resetPageAnd(resetOnTab)),
    page,
    setPage,
    lastPage,
    query,
    lastData: query.data ?? lastData,
    items,
  };
}
