import { useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { applyApiErrors } from '@lib/form-errors';

export function useFormSubmit<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  onError?: (error: unknown) => boolean,
) {
  const [alert, setAlert] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setAlert(null);
    try {
      await action();
    } catch (error) {
      if (onError?.(error)) return;
      setAlert(applyApiErrors(error, setError, fields));
    }
  };
  return { alert, run };
}
