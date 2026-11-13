import { useMatches } from 'react-router';
import type { Role } from '@constants/areas';

export interface RouteHandle {
  title?: string;
  role?: Role;
}

export const APP_NAME = 'Saúde+';

export function useRouteHandle(): RouteHandle {
  return useMatches().reduce<RouteHandle>(
    (merged, match) => ({ ...merged, ...(match.handle as RouteHandle | undefined) }),
    {},
  );
}
