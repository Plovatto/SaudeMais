import type { ReactNode } from 'react';
import { cx } from '@lib/cx';
import { tile } from './styles';

export interface InfoItem {
  key: string;
  icon: ReactNode;
  label: string;
  labelHidden?: boolean;
  value: ReactNode;
  hint?: ReactNode;
  boxed?: boolean;
}

export function InfoList({ items, className }: { items: InfoItem[]; className?: string }) {
  return (
    <dl className={cx('divide-border flex flex-col divide-y', className)}>
      {items.map(({ key, icon, label, labelHidden = false, value, hint, boxed = true }) => (
        <div
          key={key}
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 py-3 first:pt-0 last:pb-0"
        >
          <dt className={cx('col-start-2 row-start-1', labelHidden ? 'sr-only' : 'text-text-muted text-xs')}>
            {label}
          </dt>
          <dd
            aria-hidden
            className={cx(
              'col-start-1 row-span-3 row-start-1',
              boxed ? tile : 'text-text-muted mt-px inline-flex shrink-0 [&_svg]:size-[18px]',
            )}
          >
            {icon}
          </dd>
          <dd className="text-text col-start-2 text-sm font-semibold break-words">{value}</dd>
          {hint && <dd className="text-text-secondary col-start-2 text-[0.8125rem]">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
