import type { ComponentProps, ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { FieldControl, type FieldProps } from './FieldControl';
import { IconSlot } from './IconSlot';
import { controlInput } from './styles';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'aria-describedby'>, FieldProps {
  icon?: ReactNode;
  placeholder?: string;
}

export function Select({
  id,
  label,
  labelHidden,
  hint,
  error,
  'aria-describedby': describedBy,
  icon,
  placeholder,
  className,
  children,
  value,
  defaultValue,
  ...props
}: SelectProps) {
  const startsOnPlaceholder = placeholder !== undefined && value === undefined && defaultValue === undefined;
  return (
    <FieldControl
      {...{ id, label, labelHidden, hint, error, icon, className }}
      aria-describedby={describedBy}
      boxClassName="relative"
    >
      {(control) => (
        <>
          <select
            className={cx(controlInput, 'cursor-pointer appearance-none pe-8')}
            value={value}
            defaultValue={startsOnPlaceholder ? '' : defaultValue}
            {...props}
            {...control}
          >
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
