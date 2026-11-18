import { LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { Avatar, CountBadge } from '@components/ui';
import { profileUrl, type Area } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';
import { cx } from '@lib/cx';
import { Brand, brandSurface } from './Brand';
import { ariaCurrent, badgeText, countLabel, type NavItem } from './useNavItems';

function SideLink({ item }: { item: NavItem }) {
  return (
    <Link
      to={item.to}
      aria-current={ariaCurrent(item)}
      className={cx(
        'group flex min-h-[42px] items-center gap-3 rounded-[11px] px-3 text-sm transition-colors duration-150',
        item.active
          ? 'bg-white/13 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_4px_14px_-6px_rgb(0_0_0/0.4)]'
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
        <>
          <CountBadge
            inline
            className={
              item.quiet
                ? 'bg-white/14 text-white'
                : 'bg-role text-[color-mix(in_oklab,var(--role-deep)_75%,#000)]'
            }
          >
            {countLabel(item.badge)}
          </CountBadge>
          <span className="sr-only">, {badgeText(item)}</span>
        </>
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
    <aside
      className={cx(
        brandSurface,
        'sticky top-0 hidden h-dvh w-[272px] shrink-0 [scrollbar-width:none] flex-col gap-7 overflow-y-auto px-4 pt-[22px] pb-4 shadow-[inset_-1px_0_0_rgb(0_0_0/0.2)] lg:flex dark:shadow-[inset_-1px_0_0_var(--border)] print:hidden',
      )}
    >
      <Brand icon={area.icon} subtitle={area.title} />
      <NavGroup label="Menu" items={menu} />
      <NavGroup label="Conta" items={account} />
      <Link
        to={profileUrl(area.role)}
        className="can-hover:rounded-tile can-hover:bg-white/7 rounded-b-tile mt-auto flex items-center gap-2.5 border-t border-white/10 p-2 pt-3.5 transition-colors duration-150"
      >
        <Avatar name={user.fullName} role={area.role} className="shadow-[0_0_0_2px_rgb(255_255_255/0.18)]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] leading-snug font-semibold">{user.fullName}</span>
          <span className="block truncate text-xs text-white/60">{user.email}</span>
        </span>
        <LuChevronRight aria-hidden className="size-4 text-white/60" />
      </Link>
    </aside>
  );
}
