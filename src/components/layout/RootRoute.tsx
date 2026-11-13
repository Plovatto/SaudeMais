import { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { DEFAULT_ROLE } from '@constants/areas';
import { Logo } from './Logo';
import { pageSurface } from './MainContent';
import { PAGE_TITLE_ID } from './PageTitle';
import { pageTitle, useRouteHandle } from './route-handle';

function useRouteAnnouncement(): void {
  const { title } = useRouteHandle();
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    document.title = pageTitle(title);
  }, [title]);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    document.getElementById(PAGE_TITLE_ID)?.focus();
  }, [pathname]);
}

export function RootRoute() {
  useRouteAnnouncement();
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export function RootFallback() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      data-role={DEFAULT_ROLE}
      className={`${pageSurface} bg-role-strong text-on-role grid place-items-center`}
    >
      <Logo className="w-32 motion-safe:animate-pulse" />
    </div>
  );
}
