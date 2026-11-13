import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@lib/api/api-error';
import { errorMessage } from '@lib/messages/errors.pt-BR';

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!(error instanceof ApiError)) return errorMessage(error);
  const known = fields.filter((field) => error.fields[field]);
  known.forEach((field, index) => {
    setError(field, { message: error.fields[field] ?? '' }, { shouldFocus: index === 0 });
  });
  if (known.length > 0) return null;
  return Object.values(error.fields).find(Boolean) ?? errorMessage(error);
}
