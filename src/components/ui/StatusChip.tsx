import type { ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';

const tones = {
  success: 'border-success text-success-text',
  warning: 'border-warning text-warning-text',
  danger: 'border-danger text-danger-text',
  info: 'border-role text-role-text',
  neutral: 'border-border-field text-text-secondary',
};

export interface StatusChipProps {
  tone: keyof typeof tones;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StatusChip({ tone, icon, children, className }: StatusChipProps) {
  return (
    <span
      className={cx(
        'bg-surface inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon && <IconSlot>{icon}</IconSlot>}
      {children}
    </span>
  );
}
