import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages, type Page } from './page';

const pageOf = (page: number, ids: string[], total: number, pageSize = 2): Page<{ id: string }> => ({
  page,
  pageSize,
  total,
  items: ids.map((id) => ({ id })),
});

describe('fetchAllPages', () => {
  it('follows the page size the server answered with', async () => {
    const load = vi.fn((page: number) =>
      Promise.resolve(
        page === 1 ? pageOf(1, ['a', 'b'], 5) : pageOf(page, page === 2 ? ['c', 'd'] : ['e'], 5),
      ),
    );

    const items = await fetchAllPages(load);

    expect(load).toHaveBeenCalledTimes(3);
    expect(items.map(({ id }) => id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('keeps one copy of an item that moved to the next page while loading', async () => {
    const load = (page: number) =>
      Promise.resolve(page === 1 ? pageOf(1, ['a', 'b'], 3) : pageOf(2, ['b'], 3));

    expect((await fetchAllPages(load)).map(({ id }) => id)).toEqual(['a', 'b']);
  });

  it('asks only for the first page when everything fits', async () => {
    const load = vi.fn(() => Promise.resolve(pageOf(1, [], 0)));

    expect(await fetchAllPages(load)).toEqual([]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
