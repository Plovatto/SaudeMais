import { Link } from 'react-router';
import { CountBadge } from '@components/ui';
import type { Area } from '@constants/areas';
import { cx } from '@lib/cx';
import { brandSurface } from '@components/ui/styles';
import { AccountMenu } from './AccountMenu';
import { Brand } from './Brand';
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
  return (
    <aside
      aria-label="Menu lateral"
      className={cx(
        brandSurface,
        'sticky top-0 hidden h-dvh w-[272px] shrink-0 [scrollbar-width:none] flex-col gap-7 overflow-y-auto px-4 pt-[22px] pb-4 shadow-[inset_-1px_0_0_rgb(0_0_0/0.2)] lg:flex dark:shadow-[inset_-1px_0_0_var(--border)] print:hidden',
      )}
    >
      <Brand icon={area.icon} subtitle={area.title} />
      <NavGroup label="Menu" items={menu} />
      <NavGroup label="Conta" items={account} />
      <div className="mt-auto border-t border-white/10 pt-2">
        <AccountMenu area={area} placement="sidebar" />
      </div>
    </aside>
  );
}
