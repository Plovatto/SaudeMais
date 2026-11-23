export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export async function fetchAllPages<T>(
  pageOf: (page: number) => Promise<Page<T>>,
  pageSize: number,
): Promise<T[]> {
  const first = await pageOf(1);
  const pages = Math.ceil(first.total / pageSize);
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, index) => pageOf(index + 2)),
  );
  return [first, ...rest].flatMap(({ items }) => items);
}
