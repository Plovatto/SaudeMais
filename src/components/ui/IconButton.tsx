import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { iconButton } from './styles';

interface IconControlProps {
  label: string;
  icon: ReactNode;
}

const face = (icon: ReactNode) => <IconSlot className="text-xl">{icon}</IconSlot>;

export interface IconButtonProps
  extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'>, IconControlProps {}

export function IconButton({ label, icon, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cx(iconButton, className)} {...props}>
      {face(icon)}
    </button>
  );
}

export interface IconLinkProps extends Omit<ComponentProps<typeof Link>, 'aria-label'>, IconControlProps {}

export function IconLink({ label, icon, className, children, ...props }: IconLinkProps) {
  return (
    <Link aria-label={label} className={cx(iconButton, className)} {...props}>
      {face(icon)}
      {children}
    </Link>
  );
}
