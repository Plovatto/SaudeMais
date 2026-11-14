import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { RootFallback } from '@components/layout/RootRoute';
import { StandaloneScreen } from '@components/layout/StandaloneScreen';
import { useAreaRole, useRouteHandle } from '@components/layout/route-handle';
import { AREA_PARAM, areaSlug } from '@constants/areas';
import { ConnectionErrorPage, ForbiddenPage } from '@features/errors';
import { homeFor } from '@lib/auth/return-to';
import { useCurrentUser, useSession } from '@lib/auth/useSession';

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
    if (session.ended === 'signed-out') return <Navigate to="/login" replace />;
    const returnTo = encodeURIComponent(`${pathname}${search}`);
    return (
      <Navigate to={`/login?returnTo=${returnTo}`} replace state={{ expired: session.ended === 'expired' }} />
    );
  }
  return <Outlet />;
}

export function RequireRole() {
  const { roles } = useCurrentUser();
  const role = useAreaRole();
  const { role: routeRole } = useRouteHandle();
  const [params] = useSearchParams();
  if (!roles.includes(role)) {
    return (
      <StandaloneScreen>
        <ForbiddenPage />
      </StandaloneScreen>
    );
  }
  if (!routeRole && params.get(AREA_PARAM) !== areaSlug(role)) {
    const normalized = new URLSearchParams(params);
    normalized.set(AREA_PARAM, areaSlug(role));
    return <Navigate to={{ search: `?${normalized}` }} replace />;
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
