import { LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { Avatar } from '@components/ui';
import { profileUrl, type Area } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';
import { cx } from '@lib/cx';
import { ariaCurrent, badgeText, countLabel, type NavItem } from './useNavItems';

function SideLink({ item }: { item: NavItem }) {
  return (
    <Link
      to={item.to}
      aria-current={ariaCurrent(item)}
      className={cx(
        'group relative flex min-h-[42px] items-center gap-3 rounded-[11px] px-3 text-sm transition-colors duration-150',
        item.active
          ? 'before:bg-role motion-safe:before:animate-fade bg-white/13 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_4px_14px_-6px_rgb(0_0_0/0.4)] before:absolute before:-start-4 before:top-[9px] before:bottom-[9px] before:w-[3px] before:rounded-e-[3px] before:shadow-[0_0_12px_var(--role)]'
          : 'can-hover:bg-white/7 can-hover:text-white font-medium text-white/75',
      )}
    >
      <item.icon
        aria-hidden
        className={cx(
          'size-[18px] shrink-0',
          item.active ? 'text-role' : 'text-white/60 group-hover:text-white',
        )}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={cx(
            'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.71875rem] font-bold tabular-nums',
            item.quiet
              ? 'bg-white/14 text-white'
              : 'bg-role text-[color-mix(in_oklab,var(--role-deep)_75%,#000)]',
          )}
        >
          <span aria-hidden>{countLabel(item.badge)}</span>
          <span className="sr-only">, {badgeText(item)}</span>
        </span>
      ) : null}
    </Link>
  );
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <nav aria-label={label} className="flex flex-col gap-0.5">
      <span className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.06em] text-white/60 uppercase">
        {label}
      </span>
      {items.map((item) => (
        <SideLink key={item.key} item={item} />
      ))}
    </nav>
  );
}

export function Sidebar({ area, menu, account }: { area: Area; menu: NavItem[]; account: NavItem[] }) {
  const user = useCurrentUser();
  return (
    <aside className="bg-role-deep sticky top-0 hidden h-dvh w-[272px] shrink-0 [scrollbar-width:none] flex-col gap-7 overflow-y-auto bg-[radial-gradient(120%_60%_at_0%_0%,rgb(255_255_255/0.08),transparent_60%),radial-gradient(circle,rgb(255_255_255/0.06)_1px,transparent_1.4px)] bg-size-[100%_100%,18px_18px] px-4 pt-[22px] pb-4 text-white shadow-[inset_-1px_0_0_rgb(0_0_0/0.2)] [--focus:#fff] lg:flex dark:bg-[color-mix(in_oklab,var(--role-deep)_70%,#000)] dark:shadow-[inset_-1px_0_0_var(--border)] print:hidden">
      <div className="flex items-center gap-3 px-2 py-0.5">
        <span className="text-role-strong dark:bg-role dark:text-role-deep rounded-tile grid size-10 shrink-0 place-items-center bg-white shadow-[0_6px_16px_-6px_rgb(0_0_0/0.45),inset_0_-2px_0_rgb(0_0_0/0.06)]">
          <area.icon aria-hidden className="size-[22px]" />
        </span>
        <div>
          <p className="text-lg leading-[1.15] font-bold tracking-[-0.02em]">Saúde+</p>
          <p className="text-xs font-medium text-white/60">{area.title}</p>
        </div>
      </div>
      <NavGroup label="Menu" items={menu} />
      <NavGroup label="Conta" items={account} />
      <Link
        to={profileUrl(area.role)}
        className="can-hover:rounded-tile can-hover:bg-white/7 rounded-b-tile mt-auto flex items-center gap-2.5 border-t border-white/10 p-2 pt-3.5 transition-colors duration-150"
      >
        <Avatar name={user.fullName} seed={user.id} className="shadow-[0_0_0_2px_rgb(255_255_255/0.18)]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] leading-snug font-semibold">{user.fullName}</span>
          <span className="block truncate text-xs text-white/60">{user.email}</span>
        </span>
        <LuChevronRight aria-hidden className="size-4 text-white/60" />
      </Link>
    </aside>
  );
}
