import type { ReactNode } from 'react';
import { SectionCard, type SectionCardProps } from '@components/ui';
import { footerBar } from '@components/ui/styles';
import { cx } from '@lib/cx';

export function SettingsCard({ flush = true, className, ...props }: SectionCardProps) {
  return (
    <SectionCard
      flush={flush}
      tabIndex={-1}
      className={cx(
        'scroll-mt-[calc(84px+env(safe-area-inset-top))] focus:outline-none lg:scroll-mt-4',
        className,
      )}
      {...props}
    />
  );
}

export function SettingsFooter({ children }: { children: ReactNode }) {
  return (
    <div className={cx(footerBar, 'flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-5')}>
      {children}
    </div>
  );
}
