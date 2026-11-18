import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@lib/api/api-fetch';
import { MINUTE_MS } from '@lib/date';
import { queryKeys } from '@lib/query-keys';

const CATALOG_STALE_TIME = 10 * MINUTE_MS;

const onlyActive = <T extends { isActive: boolean }>(items: T[]) => items.filter((item) => item.isActive);

export function useActiveSpecialties() {
  return useQuery({
    queryKey: queryKeys.catalog.activeSpecialties,
    queryFn: ({ signal }) => apiFetch('get', '/api/specialties', { signal }),
    select: onlyActive,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useActiveUnits(examTypeId?: string) {
  return useQuery({
    queryKey: queryKeys.catalog.activeUnitsFor(examTypeId ?? ''),
    queryFn: ({ signal }) =>
      apiFetch('get', '/api/units', { query: examTypeId ? { examTypeId } : {}, signal }),
    select: onlyActive,
    enabled: examTypeId !== '',
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useActiveExamTypes() {
  return useQuery({
    queryKey: queryKeys.catalog.activeExamTypes,
    queryFn: ({ signal }) => apiFetch('get', '/api/exam-types', { signal }),
    select: onlyActive,
    staleTime: CATALOG_STALE_TIME,
  });
}
