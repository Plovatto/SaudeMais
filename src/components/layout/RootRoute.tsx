import { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { applyPageSeo } from '@lib/seo';
import { ConsentBanner } from './ConsentBanner';
import { PAGE_TITLE_ID } from './PageTitle';
import { pageTitle, useRouteHandle } from './route-handle';
import { SplashScreen } from './SplashScreen';

function useRouteAnnouncement(): void {
  const { title, seo } = useRouteHandle();
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);
  const seoTitle = seo?.title;
  const seoDescription = seo?.description;
  const indexable = seo?.index === true;

  useEffect(() => {
    applyPageSeo({
      title: seoTitle ?? pageTitle(title),
      description: seoDescription,
      path: pathname,
      index: indexable,
    });
  }, [title, seoTitle, seoDescription, indexable, pathname]);

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
      <ConsentBanner />
    </>
  );
}

export function RootFallback() {
  return <SplashScreen />;
}
