import type { ComponentProps } from 'react';
import { cx } from '@lib/cx';
import { FieldControl, type FieldProps } from './FieldControl';
import { controlInput } from './styles';

export interface TextareaProps extends ComponentProps<'textarea'>, FieldProps {}

export function Textarea({
  id,
  label,
  labelHidden,
  hint,
  error,
  className,
  rows = 3,
  ...props
}: TextareaProps) {
  return (
    <FieldControl {...{ id, label, labelHidden, hint, error, className }} boxClassName="items-stretch">
      {(control) => <textarea {...control} rows={rows} className={cx(controlInput, 'resize-y')} {...props} />}
    </FieldControl>
  );
}
