import { useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { applyApiErrors } from '@lib/form-errors';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';

export function useFormSubmit<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  onError?: (error: unknown) => boolean,
  messages?: MessageOverrides,
) {
  const [alert, setAlert] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setAlert(null);
    try {
      await action();
    } catch (error) {
      if (onError?.(error)) return;
      setAlert(applyApiErrors(error, setError, fields, messages));
    }
  };
  return { alert, run };
}
