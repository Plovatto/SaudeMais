import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { iconButton } from './styles';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  label: string;
  icon: ReactNode;
}

export function IconButton({ label, icon, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cx(iconButton, className)} {...props}>
      <IconSlot className="text-xl">{icon}</IconSlot>
    </button>
  );
}
