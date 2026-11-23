import type { ReactNode } from 'react';
import { DEFAULT_ROLE } from '@constants/areas';
import { MainContent } from './MainContent';
import { RoleSurface } from './RoleSurface';

export function StandaloneScreen({ children }: { children: ReactNode }) {
  return (
    <RoleSurface role={DEFAULT_ROLE}>
      <MainContent className="px-4">{children}</MainContent>
    </RoleSurface>
  );
}
