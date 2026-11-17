import type { ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';

const tones = {
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  info: 'bg-role-soft text-role-text',
  neutral: 'bg-surface-strong text-text-secondary',
};

export interface StatusChipProps {
  tone: keyof typeof tones;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function StatusChip({ tone, icon, dot = true, children, className }: StatusChipProps) {
  return (
    <span
      className={cx(
        'inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap print:border',
        !icon && dot && 'ps-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-current',
        tones[tone],
        className,
      )}
    >
      {icon && <IconSlot>{icon}</IconSlot>}
      {children}
    </span>
  );
}
