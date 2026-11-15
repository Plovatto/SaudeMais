import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@lib/api/api-error';
import { errorMessage, messageFor, type MessageOverrides } from '@lib/messages/errors.pt-BR';

export type FieldAliases<T extends FieldValues> = Readonly<Record<string, Path<T>>>;

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  messages?: MessageOverrides,
  aliases: FieldAliases<T> = {},
): string | null {
  if (!(error instanceof ApiError)) return errorMessage(error, messages);
  const targets: (readonly [string, Path<T>])[] = [
    ...fields.map((field) => [field, field] as const),
    ...Object.entries(aliases),
  ];
  const known = targets.filter(([name]) => error.fields[name]);
  known.forEach(([name, field], index) => {
    setError(field, { message: error.fields[name] ?? '' }, { shouldFocus: index === 0 });
  });
  if (known.length > 0) return null;
  const fieldMessage = Object.values(error.fields).find(Boolean);
  const generic = error.code === 'VALIDATION_ERROR' || messageFor(error.code, messages) === undefined;
  return fieldMessage && generic ? fieldMessage : errorMessage(error, messages);
}
