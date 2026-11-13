import { Outlet } from 'react-router';
import { areas } from '@constants/areas';
import { AppHeader } from './AppHeader';
import { MainNav } from './MainNav';
import { useRouteHandle } from './route-handle';
import { SkipLink, MAIN_ID } from './SkipLink';

export function RoleLayout() {
  const area = areas[useRouteHandle().role ?? 'patient'];
  return (
    <div data-role={area.role} className="bg-canvas text-text min-h-dvh">
      <SkipLink />
      <AppHeader area={area} />
      <div className="mx-auto flex max-w-[1280px] gap-6 lg:px-6">
        <aside className="hidden w-60 shrink-0 pt-6 lg:block">
          <MainNav area={area} variant="side" />
        </aside>
        <main
          id={MAIN_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-[480px] min-w-0 px-4 pt-6 pb-28 focus-visible:outline-none lg:max-w-[1040px] lg:px-0 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>
      <div className="border-border bg-surface shadow-card fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
        <MainNav area={area} variant="bar" />
      </div>
    </div>
  );
}
