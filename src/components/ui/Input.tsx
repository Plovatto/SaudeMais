import type { ComponentProps, ReactNode } from 'react';
import { FieldControl, type FieldProps } from './FieldControl';
import { controlInput } from './styles';

export interface InputProps extends Omit<ComponentProps<'input'>, 'aria-describedby'>, FieldProps {
  icon?: ReactNode;
  end?: ReactNode;
}

export function Input({
  id,
  label,
  labelHidden,
  hint,
  error,
  'aria-describedby': describedBy,
  icon,
  end,
  className,
  ...props
}: InputProps) {
  return (
    <FieldControl
      {...{ id, label, labelHidden, hint, error, icon, end, className }}
      aria-describedby={describedBy}
    >
      {(control) => <input className={controlInput} {...props} {...control} />}
    </FieldControl>
  );
}
