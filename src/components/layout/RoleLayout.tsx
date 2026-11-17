import { Outlet, useLocation } from 'react-router';
import { areas, currentPage } from '@constants/areas';
import { cx } from '@lib/cx';
import { BottomNav } from './BottomNav';
import { MainContent, pageSurface, SkipLink } from './MainContent';
import { useAreaRole } from './route-handle';
import { Sidebar } from './Sidebar';
import { Masthead, TopBar } from './TopBars';
import { useNavItems } from './useNavItems';

export function RoleLayout() {
  const area = areas[useAreaRole()];
  const { pathname } = useLocation();
  const { menu, account, tabs, fab } = useNavItems(area);
  const flow = currentPage(area, pathname)?.flow === true;
  return (
    <div data-role={area.role} className={cx(pageSurface, 'flex')}>
      <SkipLink />
      <Sidebar area={area} menu={menu} account={account} />
      <div className="relative isolate min-w-0 flex-1">
        <Masthead />
        <TopBar area={area} />
        <MainContent
          className={cx(
            'max-w-[1200px] px-4 pt-4 lg:px-8 lg:pt-2 lg:pb-14 print:max-w-none print:px-0',
            flow
              ? 'pb-[calc(14rem+env(safe-area-inset-bottom))]'
              : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]',
          )}
        >
          <div key={pathname} data-shell className="motion-safe:animate-rise">
            <Outlet />
          </div>
        </MainContent>
      </div>
      {!flow && <BottomNav area={area} tabs={tabs} fab={fab} />}
    </div>
  );
}
