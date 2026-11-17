import type { ComponentProps, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { softTones } from './styles';
import { IconSlot } from './IconSlot';

export interface TileButtonProps extends ComponentProps<'button'> {
  icon: ReactNode;
  label: string;
  selected?: boolean;
  badge?: ReactNode;
}

export function TileButton({
  icon,
  label,
  selected = false,
  badge,
  className,
  children,
  type = 'button',
  ...props
}: TileButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'rounded-tile bg-surface text-text shadow-card relative flex min-h-24 flex-col items-center justify-center gap-0.5 border-2 px-3 py-3 transition-colors',
        selected ? 'border-role-strong' : 'can-hover:border-border dark:border-border border-transparent',
        className,
      )}
      {...props}
    >
      <IconSlot className={cx(softTones.info, 'mb-1 size-8 justify-center rounded-full text-lg')}>
        {icon}
      </IconSlot>
      {children} <span className="text-text-secondary text-xs font-medium">{label}</span>
      {badge}
    </button>
  );
}
