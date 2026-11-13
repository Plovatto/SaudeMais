import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { Spinner } from './Spinner';
import { buttonVariants, disabledState, type ButtonVariant } from './styles';

const sizes = {
  md: 'min-h-11 px-4 text-[0.9375rem] font-semibold',
  lg: 'min-h-[50px] px-6 text-lg font-bold',
};

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  loadingLabel = 'Carregando',
  fullWidth = false,
  className,
  children,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-disabled={loading || undefined}
      onClick={(event) => {
        if (loading) event.preventDefault();
        else onClick?.(event);
      }}
      className={cx(
        'rounded-field pressable:translate-y-px inline-flex items-center justify-center gap-2 transition-[background-color,translate] select-none',
        disabledState,
        buttonVariants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon && <IconSlot>{icon}</IconSlot>}
      {children}
      {loading && <span className="sr-only">, {loadingLabel}</span>}
    </button>
  );
}
