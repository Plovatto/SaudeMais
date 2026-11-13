import { useMatches } from 'react-router';
import type { Role } from '@constants/areas';

export interface RouteHandle {
  title?: string;
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
