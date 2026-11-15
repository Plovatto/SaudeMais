import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

interface SetOptions {
  replace?: boolean;
  reset?: readonly string[];
}

export function useSetSearchParams() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (values: Record<string, string>, { replace = false, reset = [] }: SetOptions = {}) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          for (const key of reset) updated.delete(key);
          for (const [key, value] of Object.entries(values)) {
            if (value === '') updated.delete(key);
            else updated.set(key, value);
          }
          return updated;
        },
        { replace },
      );
    },
    [setParams],
  );
}

export function useSearchParam(name: string, fallback = '') {
  const [params] = useSearchParams();
  const setParams = useSetSearchParams();
  const value = params.get(name) ?? fallback;
  const setValue = useCallback(
    (next: string, options?: SetOptions) => setParams({ [name]: next === fallback ? '' : next }, options),
    [fallback, name, setParams],
  );
  return [value, setValue] as const;
}
