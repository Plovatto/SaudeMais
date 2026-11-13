import type { ComponentProps, ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { FieldControl } from './FieldControl';
import { splitFieldProps, type FieldProps } from './field-props';
import { IconSlot } from './IconSlot';
import { controlInput } from './styles';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'aria-describedby'>, FieldProps {
  icon?: ReactNode;
  placeholder?: string;
}

export function Select({ icon, placeholder, children, value, defaultValue, ...props }: SelectProps) {
  const [field, selectProps] = splitFieldProps(props);
  const startsOnPlaceholder = placeholder !== undefined && value === undefined && defaultValue === undefined;
  return (
    <FieldControl {...field} icon={icon} boxClassName="relative">
      {(control) => (
        <>
          <select
            className={cx(controlInput, 'cursor-pointer appearance-none pe-8')}
            value={value}
            defaultValue={startsOnPlaceholder ? '' : defaultValue}
            {...selectProps}
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
