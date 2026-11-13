import { LuSunMoon } from 'react-icons/lu';
import { Outlet } from 'react-router';
import { Menu } from '@components/ui';
import { DEFAULT_ROLE } from '@constants/areas';
import { cx } from '@lib/cx';
import { MainContent, pageSurface, SkipLink } from './MainContent';
import { useRouteHandle } from './route-handle';
import { useThemeMenuItems } from './useThemeMenuItems';

export function PublicLayout() {
  const themeItems = useThemeMenuItems();
  const brand = useRouteHandle().surface === 'brand';
  return (
    <div data-role={DEFAULT_ROLE} className={cx(pageSurface, brand && 'bg-role-strong')}>
      <SkipLink />
      <div className="flex justify-end p-2">
        <Menu
          label="Tema"
          icon={<LuSunMoon />}
          items={themeItems}
          {...(brand && {
            triggerClassName: 'text-on-role can-hover:bg-on-role/15 focus-visible:outline-on-role',
          })}
        />
      </div>
      <MainContent className="max-w-[520px] px-4 pb-10">
        <Outlet />
      </MainContent>
    </div>
  );
}
