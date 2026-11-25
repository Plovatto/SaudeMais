import { cx } from '@lib/cx';
import { disabledState } from './styles';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  labelHidden?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string | undefined;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  labelHidden,
  ariaLabel,
  ariaDescribedBy,
  disabled,
  busy,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? (labelHidden ? label : undefined)}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      onClick={() => {
        if (!busy) onCheckedChange(!checked);
      }}
      className={cx(
        'rounded-field text-text inline-flex min-h-11 min-w-11 items-center gap-3 text-sm font-medium',
        labelHidden && 'justify-end',
        disabledState,
        className,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150',
          checked ? 'bg-role-strong' : 'bg-border-field',
        )}
      >
        <span
          className={cx(
            'ease-out-quint absolute start-[3px] top-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform duration-(--duration-base)',
            checked && 'translate-x-4 rtl:-translate-x-4',
          )}
        />
      </span>
      {!labelHidden && <span>{label}</span>}
    </button>
  );
}
