import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { MainContent, pageSurface } from '@components/layout/MainContent';
import { RootFallback } from '@components/layout/RootRoute';
import { useRouteHandle } from '@components/layout/route-handle';
import { DEFAULT_ROLE } from '@constants/areas';
import { ConnectionErrorPage, ForbiddenPage } from '@features/errors';
import { homeFor } from '@lib/auth/return-to';
import { useSession } from '@lib/auth/useSession';

function StandaloneScreen({ children }: { children: ReactNode }) {
  return (
    <div data-role={DEFAULT_ROLE} className={pageSurface}>
      <MainContent className="px-4">{children}</MainContent>
    </div>
  );
}

export function RequireSession() {
  const session = useSession();
  const { pathname, search } = useLocation();
  if (session.status === 'loading') return <RootFallback />;
  if (session.status === 'unreachable') {
    return (
      <StandaloneScreen>
        <ConnectionErrorPage onRetry={session.retry} />
      </StandaloneScreen>
    );
  }
  if (session.status === 'anonymous') {
    const returnTo = encodeURIComponent(`${pathname}${search}`);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace state={{ expired: session.expired }} />;
  }
  return <Outlet />;
}

export function RequireRole() {
  const session = useSession();
  const { role } = useRouteHandle();
  if (session.status === 'authenticated' && role && !session.user.roles.includes(role)) {
    return (
      <StandaloneScreen>
        <ForbiddenPage />
      </StandaloneScreen>
    );
  }
  return <Outlet />;
}

export function PublicOnly() {
  const session = useSession();
  const [params] = useSearchParams();
  if (session.status === 'loading') return <RootFallback />;
  if (session.status === 'authenticated') {
    return <Navigate to={homeFor(session.user.roles, params.get('returnTo'))} replace />;
  }
  return <Outlet />;
}
