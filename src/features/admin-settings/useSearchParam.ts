import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useSearchParam(name: string, fallback = '') {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;
  const setValue = useCallback(
    (next: string, { replace = false }: { replace?: boolean } = {}) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next === fallback) updated.delete(name);
          else updated.set(name, next);
          return updated;
        },
        { replace },
      );
    },
    [fallback, name, setParams],
  );
  return [value, setValue] as const;
}
