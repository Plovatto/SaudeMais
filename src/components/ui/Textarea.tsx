import type { ComponentProps } from 'react';
import { cx } from '@lib/cx';
import { FieldControl } from './FieldControl';
import { splitFieldProps, type FieldProps } from './field-props';
import { controlInput } from './styles';

export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'aria-describedby'>, FieldProps {}

export function Textarea({ rows = 3, ...props }: TextareaProps) {
  const [field, textareaProps] = splitFieldProps(props);
  return (
    <FieldControl {...field} boxClassName="items-stretch">
      {(control) => (
        <textarea rows={rows} className={cx(controlInput, 'resize-y')} {...textareaProps} {...control} />
      )}
    </FieldControl>
  );
}
