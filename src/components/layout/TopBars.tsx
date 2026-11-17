import { LuChevronRight } from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { currentPage, findPage, pageUrl, profileUrl, type Area } from '@constants/areas';
import { NotificationBell } from '@features/notifications';
import { useCurrentUser } from '@lib/auth/useSession';
import { cx } from '@lib/cx';
import { useRouteHandle } from './route-handle';
import { ThemeToggle } from './ThemeToggle';

function useCrumb(area: Area): { label: string; to: string } | undefined {
  const { pathname } = useLocation();
  const page = currentPage(area, pathname);
  if (!page) return { label: 'Conta', to: profileUrl(area.role) };
  const parent = page.parent === undefined ? undefined : findPage(area, page.parent);
  return parent && { label: parent.nav?.label ?? parent.title, to: pageUrl(area, parent) };
}

function Who({ area }: { area: Area }) {
  const user = useCurrentUser();
  return (
    <Link
      to={profileUrl(area.role)}
      aria-label="Meu perfil"
      className="flex min-w-0 flex-1 items-center gap-3 lg:hidden"
    >
      <span
        className={cx(
          'grid size-11 shrink-0 place-items-center rounded-[13px] text-white',
          area.role === 'admin'
            ? 'bg-role-strong shadow-[0_6px_14px_-8px_var(--role-strong)]'
            : 'bg-role shadow-[0_6px_14px_-8px_var(--role)]',
        )}
      >
        <area.icon aria-hidden className="size-[22px]" />
      </span>
      <span aria-hidden className="flex min-w-0 flex-col">
        <span className="text-text-secondary text-[1.0625rem] leading-tight font-bold tracking-[-0.01em]">
          {area.label}
        </span>
        <span className="text-text-muted truncate text-[0.78125rem]">{user.fullName}</span>
      </span>
    </Link>
  );
}

function Crumbs({ area }: { area: Area }) {
  const { title } = useRouteHandle();
  const crumb = useCrumb(area);
  return (
    <nav
      aria-label="Você está em"
      className="text-text-secondary hidden min-w-0 flex-1 items-center gap-2 text-[0.8125rem] font-medium lg:flex"
    >
      {crumb && (
        <>
          <Link to={crumb.to} className="can-hover:text-text truncate transition-colors duration-150">
            {crumb.label}
          </Link>
          <LuChevronRight aria-hidden className="text-text-muted size-3.5 shrink-0" />
        </>
      )}
      <span aria-current="page" className="text-text truncate font-semibold">
        {title}
      </span>
    </nav>
  );
}

export function TopBar({ area }: { area: Area }) {
  return (
    <header className="max-lg:border-border max-lg:bg-surface/88 sticky top-0 z-20 flex min-h-[68px] items-center gap-3 px-4 pt-[env(safe-area-inset-top)] max-lg:border-b max-lg:shadow-[0_8px_20px_-16px_rgb(16_42_41/0.35)] max-lg:backdrop-blur-[14px] lg:static lg:min-h-16 lg:px-8 lg:pt-0 print:hidden">
      <Who area={area} />
      <Crumbs area={area} />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell key={area.role} role={area.role} />
      </div>
    </header>
  );
}

export function Masthead() {
  return (
    <div
      aria-hidden
      className="bg-role-soft absolute inset-x-0 top-0 -z-10 h-[180px] [mask-image:linear-gradient(to_bottom,#000_35%,transparent)] opacity-55 lg:h-[220px] dark:opacity-25 print:hidden"
    />
  );
}
