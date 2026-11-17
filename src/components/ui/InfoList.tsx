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
        <div key={key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span
            aria-hidden
            className={boxed ? tile : 'text-text-muted mt-0.5 inline-flex shrink-0 [&_svg]:size-[18px]'}
          >
            {icon}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <dt className={labelHidden ? 'sr-only' : 'text-text-muted text-xs'}>{label}</dt>
            <dd className="text-text text-sm font-semibold break-words">{value}</dd>
            {hint && <dd className="text-text-secondary text-[0.8125rem]">{hint}</dd>}
          </div>
        </div>
      ))}
    </dl>
  );
}
