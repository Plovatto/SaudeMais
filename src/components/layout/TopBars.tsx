import { LuChevronRight } from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { NOTIFICATIONS_PATH, parentLink, profileUrl, type Area } from '@constants/areas';
import { NotificationBell } from '@features/notifications';
import { useCurrentUser } from '@lib/auth/useSession';
import { RoleLogo } from './RoleLogo';
import { useRouteHandle } from './route-handle';
import { ThemeToggle } from './ThemeToggle';

function useCrumb(area: Area): { label: string; to: string } | undefined {
  const { pathname } = useLocation();
  const profile = profileUrl(area.role);
  return pathname === NOTIFICATIONS_PATH || pathname === profile
    ? { label: 'Conta', to: profile }
    : parentLink(area, pathname);
}

function Who({ area }: { area: Area }) {
  const user = useCurrentUser();
  return (
    <Link to={profileUrl(area.role)} className="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
      <RoleLogo area={area} />
      <span className="flex min-w-0 flex-col">
        <span className="text-text-secondary text-[1.0625rem] leading-tight font-bold tracking-[-0.01em]">
          {area.label}
        </span>
        <span className="text-text-muted truncate text-[0.78125rem]">
          <span className="sr-only">, </span>
          {user.fullName}
          <span className="sr-only">, meu perfil</span>
        </span>
      </span>
    </Link>
  );
}

function Crumbs({ area }: { area: Area }) {
  const { title, crumb: current } = useRouteHandle();
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
        {current ?? title}
      </span>
    </nav>
  );
}

export function TopBar({ area }: { area: Area }) {
  return (
    <header className="max-lg:border-border max-lg:bg-surface/88 dark:max-lg:bg-surface/92 sticky top-0 z-20 flex min-h-[68px] items-center gap-3 px-4 pt-[env(safe-area-inset-top)] max-lg:border-b max-lg:ps-[max(1rem,env(safe-area-inset-left))] max-lg:pe-[max(1rem,env(safe-area-inset-right))] max-lg:shadow-[0_8px_20px_-16px_rgb(16_42_41/0.35)] max-lg:backdrop-blur-[14px] lg:static lg:min-h-16 lg:px-8 lg:pt-0 print:hidden">
      <Who area={area} />
      <Crumbs area={area} />
      <div className="-me-0.5 flex items-center gap-2 lg:me-0 lg:gap-1">
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
      className="bg-role-soft absolute inset-x-0 top-0 -z-10 h-[180px] [mask-image:linear-gradient(to_bottom,#000_35%,transparent)] opacity-55 lg:h-[220px] dark:[mask-image:linear-gradient(to_bottom,#000_10%,transparent_85%)] dark:opacity-25 print:hidden"
    />
  );
}
