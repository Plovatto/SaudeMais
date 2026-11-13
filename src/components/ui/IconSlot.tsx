import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

const badges = {
  soft: 'bg-role-soft text-2xl text-role-text',
  strong: 'bg-role-strong text-3xl text-on-role',
};

export interface IconSlotProps {
  children: ReactNode;
  badge?: keyof typeof badges;
  className?: string;
}

export function IconSlot({ children, badge, className }: IconSlotProps) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center',
        badge && 'size-14 justify-center rounded-full',
        badge && badges[badge],
        className,
      )}
    >
      {children}
    </span>
  );
}
