import type { ComponentProps, ReactNode } from 'react';
import { FieldControl } from './FieldControl';
import { splitFieldProps, type FieldProps } from './field-props';
import { controlInput } from './styles';

export interface InputProps extends Omit<ComponentProps<'input'>, 'aria-describedby'>, FieldProps {
  icon?: ReactNode;
  end?: ReactNode;
}

export function Input({ icon, end, ...props }: InputProps) {
  const [field, inputProps] = splitFieldProps(props);
  return (
    <FieldControl {...field} icon={icon} end={end}>
      {(control) => <input className={controlInput} {...inputProps} {...control} />}
    </FieldControl>
  );
}
