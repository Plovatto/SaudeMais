import { Link } from 'react-router';
import { cx } from '@lib/cx';
import { ariaCurrent, badgeText, countLabel, type NavItem } from './useNavItems';

function Tab({ item }: { item: NavItem }) {
  return (
    <li className="min-w-0">
      <Link
        to={item.to}
        aria-current={ariaCurrent(item)}
        className={cx(
          'pressable:scale-95 relative flex min-h-12 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-[color,scale] duration-150',
          item.active ? 'text-role-text [&_svg]:text-role-strong' : 'text-text-muted',
        )}
      >
        <item.icon aria-hidden className="size-[22px]" />
        <span className="max-w-full truncate">{item.short}</span>
        {item.key === 'notificacoes' && item.badge ? (
          <span className="bg-danger-strong text-on-danger ring-surface absolute end-[calc(50%-20px)] top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.625rem] font-bold ring-2">
            <span aria-hidden>{countLabel(item.badge)}</span>
            <span className="sr-only">, {badgeText(item)}</span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function BottomNav({ tabs, fab }: { tabs: NavItem[]; fab: NavItem | undefined }) {
  const middle = Math.ceil(tabs.length / 2);
  return (
    <nav
      aria-label="Principal"
      className="border-border bg-surface shadow-dock fixed inset-x-0 bottom-0 z-30 border-t ps-[max(0.5rem,env(safe-area-inset-left))] pe-[max(0.5rem,env(safe-area-inset-right))] pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden print:hidden"
    >
      <ul className="grid auto-cols-fr grid-flow-col items-end">
        {tabs.slice(0, middle).map((item) => (
          <Tab key={item.key} item={item} />
        ))}
        {fab && (
          <li>
            <Link
              to={fab.to}
              aria-label={fab.label}
              aria-current={ariaCurrent(fab)}
              className="bg-role-strong text-on-role pressable:scale-95 rounded-card mx-auto -mt-[22px] mb-[9px] grid size-[52px] place-items-center shadow-[0_8px_20px_-6px_var(--role-strong),0_0_0_4px_var(--surface)] transition-transform duration-150 ease-out"
            >
              <fab.icon aria-hidden className="size-[22px]" />
            </Link>
          </li>
        )}
        {tabs.slice(middle).map((item) => (
          <Tab key={item.key} item={item} />
        ))}
      </ul>
    </nav>
  );
}
