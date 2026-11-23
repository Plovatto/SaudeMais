import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Role } from '@constants/areas';
import { useTheme } from '@hooks/useTheme';
import { cx } from '@lib/cx';
import { cursorProperties } from '@lib/cursor';

const pageSurface = 'min-h-dvh bg-canvas text-text';

export interface RoleSurfaceProps {
  role: Role;
  className?: string;
  children: ReactNode;
}

export function RoleSurface({ role, className, children }: RoleSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useLayoutEffect(() => {
    const surface = ref.current;
    if (!surface || window.matchMedia?.('(forced-colors: active)').matches) return;
    const tokens = getComputedStyle(surface);
    const fill = tokens.getPropertyValue(theme === 'dark' ? '--role' : '--role-strong').trim();
    const outline = tokens.getPropertyValue('--surface').trim();
    if (!fill || !outline) return;
    const properties = cursorProperties({ fill, outline });
    const root = document.documentElement.style;
    for (const [name, value] of Object.entries(properties)) root.setProperty(name, value);
    return () => {
      for (const name of Object.keys(properties)) root.removeProperty(name);
    };
  }, [role, theme]);

  return (
    <div ref={ref} data-role={role} className={cx(pageSurface, className)}>
      {children}
    </div>
  );
}
