import type { ReactNode } from 'react';
import { LuCircleAlert } from 'react-icons/lu';
import { cx } from '@lib/cx';
import type { FieldProps } from './field-props';
import { IconSlot } from './IconSlot';
import { controlBox } from './styles';
import { useField, type FieldControlAttributes } from './useField';

interface FieldControlProps extends FieldProps {
  id?: string | undefined;
  icon?: ReactNode;
  end?: ReactNode;
  boxClassName?: string | undefined;
  className?: string | undefined;
  children: (control: FieldControlAttributes) => ReactNode;
}

export function FieldError({ id, children }: { id?: string | undefined; children: ReactNode }) {
  return (
    <p id={id} className="text-danger-text flex items-center gap-1.5 text-sm font-medium">
      <LuCircleAlert aria-hidden className="shrink-0" />
      {children}
    </p>
  );
}

export function FieldControl({
  id,
  label,
  labelHidden,
  hint,
  error,
  invalid: flagged,
  'aria-describedby': describedBy,
  icon,
  end,
  boxClassName,
  className,
  children,
}: FieldControlProps) {
  const { control, hintId, errorId, invalid } = useField(id, { hint, error, invalid: flagged, describedBy });
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={control.id}
        className={cx('text-text text-[0.9375rem] font-semibold', labelHidden && 'sr-only')}
      >
        {label}
      </label>
      <div className={cx(controlBox(invalid), end !== undefined && 'pe-0', boxClassName)}>
        {icon && <IconSlot className="text-text-muted text-xl">{icon}</IconSlot>}
        {children(control)}
        {end}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && (
        <p id={hintId} className="text-text-secondary text-sm">
          {hint}
        </p>
      )}
    </div>
  );
}
