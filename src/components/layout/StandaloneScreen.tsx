import type { ReactNode } from 'react';
import { DEFAULT_ROLE } from '@constants/areas';
import { MainContent, pageSurface } from './MainContent';

export function StandaloneScreen({ children }: { children: ReactNode }) {
  return (
    <div data-role={DEFAULT_ROLE} className={pageSurface}>
      <MainContent className="px-4">{children}</MainContent>
    </div>
  );
}
