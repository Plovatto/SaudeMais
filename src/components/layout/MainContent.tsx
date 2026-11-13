import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

const MAIN_ID = 'conteudo';

export const pageSurface = 'min-h-dvh bg-canvas text-text';

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="rounded-field bg-surface text-role-text shadow-card sr-only px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
    >
      Pular para o conteúdo
    </a>
  );
}

export function MainContent({ className, children }: { className: string; children: ReactNode }) {
  return (
    <main id={MAIN_ID} tabIndex={-1} className={cx('mx-auto w-full focus-visible:outline-none', className)}>
      {children}
    </main>
  );
}
