import { Outlet } from 'react-router';
import { areas, DEFAULT_ROLE } from '@constants/areas';
import { AppHeader } from './AppHeader';
import { layoutWidth, MainContent, pageSurface, SkipLink } from './MainContent';
import { MainNav } from './MainNav';
import { useRouteHandle } from './route-handle';

export function RoleLayout() {
  const area = areas[useRouteHandle().role ?? DEFAULT_ROLE];
  return (
    <div data-role={area.role} className={pageSurface}>
      <SkipLink />
      <AppHeader area={area} />
      <div className={`${layoutWidth} flex gap-6 lg:px-6`}>
        <aside className="hidden w-60 shrink-0 pt-6 lg:block">
          <MainNav area={area} variant="side" />
        </aside>
        <MainContent className="max-w-[480px] min-w-0 px-4 pt-6 pb-28 lg:max-w-[1040px] lg:px-0 lg:pb-10">
          <Outlet />
        </MainContent>
      </div>
      <div className="border-border bg-surface shadow-card fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
        <MainNav area={area} variant="bar" />
      </div>
    </div>
  );
}
