export type PageItem = number | 'gap';

export function paginationRange(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'gap', totalPages];
  if (page >= totalPages - 3) {
    return [1, 'gap', ...Array.from({ length: 5 }, (_, index) => totalPages - 4 + index)];
  }
  return [1, 'gap', page - 1, page, page + 1, 'gap', totalPages];
}
