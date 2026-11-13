import type { ComponentProps } from 'react';
import { cx } from '@lib/cx';
import { FieldControl, type FieldProps } from './FieldControl';
import { controlInput } from './styles';

export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'aria-describedby'>, FieldProps {}

export function Textarea({
  id,
  label,
  labelHidden,
  hint,
  error,
  'aria-describedby': describedBy,
  className,
  rows = 3,
  ...props
}: TextareaProps) {
  return (
    <FieldControl
      {...{ id, label, labelHidden, hint, error, className }}
      aria-describedby={describedBy}
      boxClassName="items-stretch"
    >
      {(control) => <textarea rows={rows} className={cx(controlInput, 'resize-y')} {...props} {...control} />}
    </FieldControl>
  );
}
