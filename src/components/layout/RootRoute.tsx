import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { PAGE_TITLE_ID } from './PageTitle';
import { APP_NAME, useRouteHandle } from './route-handle';

function useRouteAnnouncement(): void {
  const { title } = useRouteHandle();
  const { pathname } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = title && title !== APP_NAME ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById(PAGE_TITLE_ID)?.focus();
  }, [pathname]);
}

export function RootRoute() {
  useRouteAnnouncement();
  return <Outlet />;
}
