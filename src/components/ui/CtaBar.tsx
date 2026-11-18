import type { ReactNode } from 'react';
import { cx } from '@lib/cx';
import { tile } from './styles';

export interface CtaBarProps {
  icon: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  muted?: boolean;
  aboveNav?: boolean;
  children: ReactNode;
}

export const ctaButton = 'h-[54px] w-full rounded-[15px] text-base font-bold';

export function CtaBar({ icon, title, sub, muted = false, aboveNav = false, children }: CtaBarProps) {
  return (
    <>
      {aboveNav && <div aria-hidden className="h-36 lg:hidden" />}
      <div
        data-cta-bar={aboveNav || undefined}
        className={cx(
          'border-border bg-surface motion-safe:animate-sheet fixed inset-x-0 bottom-0 flex flex-wrap items-center gap-x-3.5 gap-y-5 rounded-t-[26px] border-t px-5 ps-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))] pt-5 shadow-[0_-2px_6px_rgb(16_42_41/0.06),0_-22px_44px_-16px_rgb(16_42_41/0.4)] print:hidden',
          aboveNav
            ? 'z-[29] pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:hidden'
            : 'z-30 pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
        )}
      >
        <span aria-hidden className={cx(tile, 'size-12 rounded-[14px] [&_svg]:size-[22px]')}>
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p
            className={cx(
              'truncate text-[1.09375rem] font-bold tabular-nums',
              muted ? 'text-text-muted' : 'text-text',
            )}
          >
            {title}
          </p>
          <p className="text-text-secondary truncate text-[0.84375rem]">{sub}</p>
        </div>
        {children}
      </div>
    </>
  );
}
