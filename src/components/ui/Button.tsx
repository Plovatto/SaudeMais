import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { Spinner } from './Spinner';
import { buttonClass, type ButtonStyle } from './styles';

export interface ButtonProps extends ComponentProps<'button'>, ButtonStyle {
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
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
      className={cx(buttonClass({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading ? <Spinner /> : icon && <IconSlot>{icon}</IconSlot>}
      {children}
      {loading && <span className="sr-only">, {loadingLabel}</span>}
    </button>
  );
}
