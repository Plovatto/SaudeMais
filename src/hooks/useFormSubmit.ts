import { useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { applyApiErrors, type FieldAliases } from '@lib/form-errors';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';

export function useFormSubmit<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  onError?: (error: unknown) => boolean,
  messages?: MessageOverrides,
  aliases?: FieldAliases<T>,
) {
  const [alert, setAlert] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setAlert(null);
    try {
      await action();
    } catch (error) {
      if (onError?.(error)) return;
      setAlert(applyApiErrors(error, setError, fields, messages, aliases));
    }
  };
  return { alert, run };
}
