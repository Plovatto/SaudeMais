import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useSearchParam(name: string, fallback = '') {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;
  const setValue = useCallback(
    (
      next: string,
      { replace = false, reset = [] }: { replace?: boolean; reset?: readonly string[] } = {},
    ) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          for (const key of reset) updated.delete(key);
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
