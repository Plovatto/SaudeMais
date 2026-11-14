import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@lib/api/api-fetch';
import { queryKeys } from '@lib/query-keys';

const onlyActive = <T extends { isActive: boolean }>(items: T[]) => items.filter((item) => item.isActive);

export function useActiveSpecialties() {
  return useQuery({
    queryKey: queryKeys.catalog.activeSpecialties,
    queryFn: ({ signal }) => apiFetch('get', '/api/specialties', { signal }),
    select: onlyActive,
  });
}

export function useActiveUnits() {
  return useQuery({
    queryKey: queryKeys.catalog.activeUnits,
    queryFn: ({ signal }) => apiFetch('get', '/api/units', { signal }),
    select: onlyActive,
  });
}
