import { LuSunMoon } from 'react-icons/lu';
import { Outlet } from 'react-router';
import { Menu } from '@components/ui';
import { MainContent, pageSurface, SkipLink } from './MainContent';
import { useThemeMenuItems } from './useThemeMenuItems';

export function PublicLayout() {
  const themeItems = useThemeMenuItems();
  return (
    <div data-role="patient" className={pageSurface}>
      <SkipLink />
      <div className="flex justify-end p-2">
        <Menu label="Tema" icon={<LuSunMoon />} items={themeItems} />
      </div>
      <MainContent className="max-w-[520px] px-4 pb-10">
        <Outlet />
      </MainContent>
    </div>
  );
}
