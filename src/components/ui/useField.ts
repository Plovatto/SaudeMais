import { useId } from 'react';

export interface FieldMessages {
  hint?: string | undefined;
  error?: string | undefined;
  describedBy?: string | undefined;
}

export interface FieldControlAttributes {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

export function useField(id: string | undefined, { hint, error, describedBy }: FieldMessages) {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const control: FieldControlAttributes = {
    id: fieldId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [errorId, hintId, describedBy].filter(Boolean).join(' ') || undefined,
  };
  return { control, hintId, errorId, invalid: Boolean(error) };
}
