import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { FieldError } from './FieldControl';
import { useField } from './useField';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  error?: string | undefined;
}

export function Checkbox({ id, label, error, className, ...props }: CheckboxProps) {
  const { control, errorId, invalid } = useField(id, { error });
  return (
    <div className={cx('flex flex-col', className)}>
      <div className="flex min-h-11 items-center gap-2.5">
        <input
          {...control}
          type="checkbox"
          className={cx(
            'accent-role-strong size-5 shrink-0 cursor-pointer rounded-[4px] disabled:cursor-not-allowed',
            invalid && 'ring-danger ring-offset-surface ring-2 ring-offset-2',
          )}
          {...props}
        />
        <label htmlFor={control.id} className="text-text-secondary cursor-pointer text-sm font-medium">
          {label}
        </label>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
