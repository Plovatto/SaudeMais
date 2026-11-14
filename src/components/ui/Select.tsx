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
  compact?: boolean;
}

export function Select({
  icon,
  placeholder,
  compact = false,
  children,
  value,
  defaultValue,
  ...props
}: SelectProps) {
  const [field, selectProps] = splitFieldProps(props);
  const startsOnPlaceholder = placeholder !== undefined && value === undefined && defaultValue === undefined;
  return (
    <FieldControl {...field} icon={icon} boxClassName={cx('relative', compact && 'px-2.5')}>
      {(control) => (
        <>
          <select
            className={cx(controlInput, 'cursor-pointer appearance-none', compact ? 'pe-5' : 'pe-8')}
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
          <IconSlot
            className={cx(
              'text-text-secondary pointer-events-none absolute',
              compact ? 'end-2 text-base' : 'end-3.5 text-xl',
            )}
          >
            <LuChevronDown />
          </IconSlot>
        </>
      )}
    </FieldControl>
  );
}
