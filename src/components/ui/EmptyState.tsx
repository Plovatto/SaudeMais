import type { ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'motion-safe:animate-rise flex flex-col items-center gap-3 px-6 py-10 text-center',
        className,
      )}
    >
      <IconSlot className="bg-surface-strong text-text-secondary size-14 justify-center rounded-full text-2xl">
        {icon}
      </IconSlot>
      <div className="flex flex-col gap-1">
        <p className="text-text text-[0.9375rem] font-semibold">{title}</p>
        {description && <p className="text-text-secondary max-w-xs text-[0.8125rem]">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
