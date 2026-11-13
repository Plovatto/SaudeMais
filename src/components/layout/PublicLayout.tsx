import { LuSunMoon } from 'react-icons/lu';
import { Outlet } from 'react-router';
import { Menu } from '@components/ui';
import { SkipLink, MAIN_ID } from './SkipLink';
import { useThemeMenuItems } from './useThemeMenuItems';

export function PublicLayout() {
  const themeItems = useThemeMenuItems();
  return (
    <div data-role="patient" className="bg-canvas text-text min-h-dvh">
      <SkipLink />
      <div className="flex justify-end p-2">
        <Menu label="Tema" icon={<LuSunMoon />} items={themeItems} />
      </div>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="mx-auto w-full max-w-[520px] px-4 pb-10 focus-visible:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
