import type { ComponentProps, ReactNode } from 'react';
import { FieldControl, type FieldProps } from './FieldControl';
import { controlInput } from './styles';

export interface InputProps extends ComponentProps<'input'>, FieldProps {
  icon?: ReactNode;
  end?: ReactNode;
}

export function Input({ id, label, labelHidden, hint, error, icon, end, className, ...props }: InputProps) {
  return (
    <FieldControl {...{ id, label, labelHidden, hint, error, icon, end, className }}>
      {(control) => <input {...control} className={controlInput} {...props} />}
    </FieldControl>
  );
}
