import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { squareButton } from './styles';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  label: string;
  icon: ReactNode;
  children?: ReactNode;
}

export function IconButton({ label, icon, className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(squareButton, 'text-text-secondary can-hover:bg-surface-muted', className)}
      {...props}
    >
      <IconSlot className="text-xl">{icon}</IconSlot>
      {children}
    </button>
  );
}
