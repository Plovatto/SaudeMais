import { cx } from '@lib/cx';
import { disabledState } from './styles';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  labelHidden?: boolean;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  labelHidden,
  disabled,
  busy,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelHidden ? label : undefined}
      disabled={disabled}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      onClick={() => {
        if (!busy) onCheckedChange(!checked);
      }}
      className={cx(
        'rounded-field text-text inline-flex min-h-11 items-center gap-3 text-sm font-medium',
        disabledState,
        className,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-role-strong' : 'bg-border-field',
        )}
      >
        <span
          className={cx(
            'bg-surface shadow-button absolute start-0.5 top-0.5 size-5 rounded-full transition-transform',
            checked && 'translate-x-5 rtl:-translate-x-5',
          )}
        />
      </span>
      {!labelHidden && <span>{label}</span>}
    </button>
  );
}
