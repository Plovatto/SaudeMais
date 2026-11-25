import { useRef } from 'react';
import { LuChevronDown, LuChevronsUpDown, LuLogOut, LuUserRound } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { Avatar, Menu, type MenuItem } from '@components/ui';
import { areas, profileUrl, type Area } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';
import { cx } from '@lib/cx';
import { RoleLogo } from './RoleLogo';
import { useSignOutConfirm } from './useSignOutConfirm';

type Placement = 'sidebar' | 'topbar';

const SWITCH_GROUP = 'Trocar de perfil';
const ACCOUNT_GROUP = 'Conta';

function useAccountItems(area: Area, onSignOut: () => void): MenuItem[] {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const owned = Object.values(areas).filter((item) => user.roles.includes(item.role));
  const switches: MenuItem[] =
    owned.length > 1
      ? owned.map((item) => ({
          label: item.label,
          group: SWITCH_GROUP,
          checked: item.role === area.role,
          media: (
            <span data-role={item.role} className="contents">
              <RoleLogo area={item} className="size-8 rounded-[10px] shadow-none [&_svg]:size-4" />
            </span>
          ),
          onSelect: () => {
            if (item.role !== area.role) void navigate(item.base);
          },
        }))
      : [];
  return [
    ...switches,
    {
      label: 'Meu perfil',
      group: ACCOUNT_GROUP,
      icon: <LuUserRound />,
      onSelect: () => void navigate(profileUrl(area.role)),
    },
    { label: 'Sair da conta', group: ACCOUNT_GROUP, icon: <LuLogOut />, tone: 'danger', onSelect: onSignOut },
  ];
}

export function AccountMenu({ area, placement }: { area: Area; placement: Placement }) {
  const user = useCurrentUser();
  const returnFocus = useRef<HTMLButtonElement>(null);
  const logout = useSignOutConfirm(returnFocus);
  const items = useAccountItems(area, logout.ask);
  const sidebar = placement === 'sidebar';

  return (
    <>
      <Menu
        label="Menu da conta"
        items={items}
        surface={sidebar ? 'brand' : 'default'}
        align="start"
        groupLabels
        className={sidebar ? 'flex w-full' : 'flex min-w-0 flex-1 lg:hidden'}
        panelClassName={sidebar ? 'w-full' : 'w-[min(18rem,calc(100vw-2rem))]'}
        header={
          sidebar ? undefined : (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Avatar name={user.fullName} role={area.role} />
              <span className="min-w-0">
                <span className="text-text block truncate text-sm font-semibold">{user.fullName}</span>
                <span className="text-text-muted block truncate text-xs">{user.email}</span>
              </span>
            </div>
          )
        }
        trigger={({ ref, open, ...props }) => (
          <button
            {...props}
            ref={(node) => {
              ref.current = node;
              returnFocus.current = node;
            }}
            type="button"
            className={
              sidebar
                ? cx(
                    'rounded-tile flex w-full items-center gap-2.5 p-2 text-start transition-colors duration-150',
                    open ? 'bg-white/10' : 'can-hover:bg-white/7',
                  )
                : 'rounded-field -m-1 flex min-w-0 flex-1 items-center gap-3 p-1 text-start'
            }
          >
            {sidebar ? (
              <>
                <Avatar
                  name={user.fullName}
                  role={area.role}
                  className="shadow-[0_0_0_2px_rgb(255_255_255/0.18)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] leading-snug font-semibold">
                    {user.fullName}
                  </span>
                  <span className="block truncate text-xs text-white/60">{user.email}</span>
                </span>
                <LuChevronsUpDown aria-hidden className="size-4 shrink-0 text-white/60" />
              </>
            ) : (
              <>
                <RoleLogo area={area} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-text-secondary flex items-center gap-1 text-[1.0625rem] leading-tight font-bold tracking-[-0.01em]">
                    {area.label}
                    <LuChevronDown
                      aria-hidden
                      className={cx(
                        'text-text-muted size-4 shrink-0 transition-transform duration-200',
                        open && 'rotate-180',
                      )}
                    />
                  </span>
                  <span className="text-text-muted truncate text-[0.78125rem]">{user.fullName}</span>
                </span>
              </>
            )}
            <span className="sr-only">, abrir menu da conta</span>
          </button>
        )}
      />
      {logout.dialog}
    </>
  );
}
