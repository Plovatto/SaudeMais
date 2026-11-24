import type { ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { softTones, type SoftTone } from './styles';

export interface StatusChipProps {
  tone: SoftTone;
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
        (Boolean(icon) || dot) && 'ps-2',
        !icon && dot && 'before:size-1.5 before:shrink-0 before:rounded-full before:bg-current',
        softTones[tone],
        className,
      )}
    >
      {icon && <IconSlot className="[&_svg]:size-3.5">{icon}</IconSlot>}
      {children}
    </span>
  );
}
