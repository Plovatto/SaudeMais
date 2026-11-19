import { Outlet } from 'react-router';
import { DEFAULT_ROLE } from '@constants/areas';
import { MainContent, pageSurface, SkipLink } from './MainContent';
import { useRouteHandle } from './route-handle';
import { ThemeToggle } from './ThemeToggle';

export function PublicLayout() {
  const brand = useRouteHandle().surface === 'brand';
  return (
    <div data-role={DEFAULT_ROLE} className={pageSurface}>
      <SkipLink />
      {brand ? (
        <MainContent className="min-h-dvh">
          <Outlet />
        </MainContent>
      ) : (
        <>
          <div className="flex justify-end p-2">
            <ThemeToggle />
          </div>
          <MainContent className="max-w-[520px] px-4 pb-10">
            <Outlet />
          </MainContent>
        </>
      )}
    </div>
  );
}
