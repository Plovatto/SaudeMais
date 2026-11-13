import type { ComponentProps, ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { FieldControl, type FieldProps } from './FieldControl';
import { IconSlot } from './IconSlot';
import { controlInput } from './styles';

export interface SelectProps extends ComponentProps<'select'>, FieldProps {
  icon?: ReactNode;
  placeholder?: string;
}

export function Select({
  id,
  label,
  labelHidden,
  hint,
  error,
  icon,
  placeholder,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldControl {...{ id, label, labelHidden, hint, error, icon, className }} boxClassName="relative">
      {(control) => (
        <>
          <select {...control} className={cx(controlInput, 'cursor-pointer appearance-none pe-8')} {...props}>
            {placeholder !== undefined && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <IconSlot className="text-text-secondary pointer-events-none absolute end-3.5 text-xl">
            <LuChevronDown />
          </IconSlot>
        </>
      )}
    </FieldControl>
  );
}
