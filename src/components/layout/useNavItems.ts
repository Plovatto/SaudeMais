import type { IconType } from 'react-icons';
import { LuBell, LuUser } from 'react-icons/lu';
import { useLocation } from 'react-router';
import {
  navState,
  NOTIFICATIONS_PATH,
  notificationsUrl,
  pageUrl,
  profileUrl,
  type Area,
} from '@constants/areas';
import { unreadText, useUnreadCount } from '@lib/api/notifications-api';
import { useNavBadges } from './useNavBadges';
import { plural } from '@lib/plural';

export interface NavItem {
  key: string;
  to: string;
  label: string;
  short: string;
  icon: IconType;
  active: 'page' | 'section' | undefined;
  badge?: number | undefined;
  quiet?: boolean;
}

export const countLabel = (count: number) => (count > 99 ? '99+' : String(count));

export const badgeText = ({ key, badge = 0 }: NavItem) => {
  if (key === 'notificacoes') return unreadText(badge);
  return key === 'agendamentos'
    ? plural(badge, 'agendado', 'agendados')
    : plural(badge, 'pendente', 'pendentes');
};

export const ariaCurrent = ({ active }: Pick<NavItem, 'active'>) => (active === 'section' ? 'true' : active);

export function useNavItems(area: Area) {
  const { pathname } = useLocation();
  const badges = useNavBadges(area.role);
  const unread = useUnreadCount(area.role) ?? 0;
  const menu: NavItem[] = area.pages.flatMap((page) =>
    page.nav
      ? [
          {
            key: page.path,
            to: pageUrl(area, page),
            label: page.nav.label,
            short: page.nav.short ?? page.nav.label,
            icon: page.nav.icon,
            active: navState(area, page.path, pathname),
            badge: page.nav.badge && badges[page.nav.badge],
            quiet: page.nav.badge === 'patient-upcoming',
          },
        ]
      : [],
  );
  const account: NavItem[] = [
    {
      key: 'notificacoes',
      to: notificationsUrl(area.role),
      label: 'Notificações',
      short: 'Avisos',
      icon: LuBell,
      active: pathname === NOTIFICATIONS_PATH ? 'page' : undefined,
      badge: unread,
    },
    {
      key: 'perfil',
      to: profileUrl(area.role),
      label: 'Meu perfil',
      short: 'Perfil',
      icon: LuUser,
      active: pathname === profileUrl(area.role) ? 'page' : undefined,
    },
  ];
  const tabs = area.tabs.flatMap((path) => menu.find((item) => item.key === path) ?? []);
  const fab: NavItem | undefined = area.fab && {
    key: area.fab.path,
    to: pageUrl(area, area.fab),
    label: area.fab.label,
    short: area.fab.label,
    icon: area.fab.icon,
    active: navState(area, area.fab.path, pathname),
  };
  return { menu, account, tabs: tabs.length < 4 ? [...tabs, ...account] : tabs, fab };
}
