import { useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@lib/api/api-error';
import { applyApiErrors } from '@lib/form-errors';

export function useProfileSubmit<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  onProtected: () => void,
) {
  const [alert, setAlert] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setAlert(null);
    try {
      await action();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PROTECTED_ACCOUNT') onProtected();
      setAlert(applyApiErrors(error, setError, fields));
    }
  };
  return { alert, run };
}
