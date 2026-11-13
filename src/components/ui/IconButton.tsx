import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { disabledState } from './styles';

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
      className={cx(
        'rounded-field text-text-secondary enabled:hover:bg-surface-muted inline-flex size-11 shrink-0 items-center justify-center transition-colors',
        disabledState,
        className,
      )}
      {...props}
    >
      <IconSlot className="text-xl">{icon}</IconSlot>
      {children}
    </button>
  );
}
