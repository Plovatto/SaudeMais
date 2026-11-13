import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { Spinner } from './Spinner';
import { disabledState } from './styles';

const variants = {
  primary: 'bg-role-strong text-on-role shadow-button enabled:hover:bg-role-strong/90',
  secondary: 'border border-role-strong bg-surface text-role-text enabled:hover:bg-role-soft',
  ghost: 'text-role-text enabled:hover:bg-role-soft',
  danger: 'bg-danger-strong text-on-danger shadow-button enabled:hover:bg-danger-strong/90',
};

const sizes = {
  md: 'min-h-11 px-4 text-[15px] font-semibold',
  lg: 'min-h-[50px] px-6 text-lg font-bold',
};

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'rounded-field inline-flex items-center justify-center gap-2 transition-[background-color,translate] select-none enabled:active:translate-y-px',
        disabledState,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon && <IconSlot>{icon}</IconSlot>}
      {children}
    </button>
  );
}
