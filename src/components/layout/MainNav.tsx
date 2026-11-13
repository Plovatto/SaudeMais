import { Link, useLocation } from 'react-router';
import { IconSlot } from '@components/ui';
import { navState, pageUrl, type Area, type AreaPage } from '@constants/areas';
import { cx } from '@lib/cx';

const variants = {
  bar: {
    list: 'grid grid-cols-4',
    active: '',
    link: 'min-h-16 flex-col justify-center gap-1 px-1 text-center text-[0.8125rem] leading-tight before:absolute before:inset-x-5 before:top-0 before:h-1 before:rounded-b-full',
  },
  side: {
    list: 'flex flex-col gap-1',
    active: 'bg-role-soft',
    link: 'min-h-11 gap-3 rounded-field px-3 text-[0.9375rem] before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-e-full',
  },
};

type NavPage = AreaPage & Required<Pick<AreaPage, 'nav'>>;

const isNavPage = (page: AreaPage): page is NavPage => page.nav !== undefined;

export interface MainNavProps {
  area: Area;
  variant: keyof typeof variants;
}

export function MainNav({ area, variant }: MainNavProps) {
  const { list, link, active } = variants[variant];
  const { pathname } = useLocation();
  return (
    <nav aria-label="Navegação principal">
      <ul className={list}>
        {area.pages.filter(isNavPage).map((page) => {
          const state = navState(area, page, pathname);
          return (
            <li key={page.path} className="min-w-0">
              <Link
                to={pageUrl(area, page)}
                aria-current={state === 'page' ? 'page' : state === 'section' ? 'true' : undefined}
                className={cx(
                  'relative flex items-center font-semibold transition-colors',
                  link,
                  state
                    ? cx('text-role-text before:bg-role-strong', active)
                    : 'text-text-secondary can-hover:text-role-text',
                )}
              >
                <IconSlot className="text-xl">
                  <page.nav.icon />
                </IconSlot>
                <span className="max-w-full break-words hyphens-auto">{page.nav.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
