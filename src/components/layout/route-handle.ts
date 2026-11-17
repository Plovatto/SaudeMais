import { useMatches, useSearchParams } from 'react-router';
import { AREA_PARAM, DEFAULT_ROLE, roleFromSlug, type Role } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';

export interface RouteHandle {
  title?: string;
  crumb?: string;
  role?: Role;
  surface?: 'brand';
}

export const APP_NAME = 'Saúde+';

export function pageTitle(title: string | undefined): string {
  return title && title !== APP_NAME ? `${title} · ${APP_NAME}` : APP_NAME;
}

export function useRouteHandle(): RouteHandle {
  return useMatches().reduce<RouteHandle>(
    (merged, match) => ({ ...merged, ...(match.handle as RouteHandle | undefined) }),
    {},
  );
}

export function useAreaRole(): Role {
  const { role } = useRouteHandle();
  const [params] = useSearchParams();
  const { roles } = useCurrentUser();
  return role ?? roleFromSlug(params.get(AREA_PARAM)) ?? roles[0] ?? DEFAULT_ROLE;
}
