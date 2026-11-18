import { DESKTOP_QUERY, useMediaQuery } from './useMediaQuery';
import { useSearchParam } from './useSearchParam';

export function useListSelection<Item extends { id: string }>(
  param: string,
  items: readonly Item[] | undefined,
  fallback: (items: readonly Item[]) => Item | undefined = (list) => list[0],
) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [selectedId, setSelectedId] = useSearchParam(param);
  const chosen = items?.find((item) => item.id === selectedId);
  const selected = chosen ?? (desktop && items ? fallback(items) : undefined);
  return {
    desktop,
    selectedId,
    setSelectedId,
    chosen,
    selected,
    select: (item: Item) => setSelectedId(item.id),
    closeSheet: () => setSelectedId('', { replace: true }),
  };
}
