export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export async function fetchAllPages<T extends { id: string }>(
  pageOf: (page: number) => Promise<Page<T>>,
): Promise<T[]> {
  const first = await pageOf(1);
  const pages = Math.ceil(first.total / first.pageSize);
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, index) => pageOf(index + 2)),
  );
  const items = [first, ...rest].flatMap((page) => page.items);
  return [...new Map(items.map((item) => [item.id, item] as const)).values()];
}
