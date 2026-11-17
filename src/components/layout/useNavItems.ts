import { useQuery } from '@tanstack/react-query';
import type { IconType } from 'react-icons';
import { LuBell, LuUser } from 'react-icons/lu';
import { useLocation } from 'react-router';
import {
  findPage,
  navState,
  NOTIFICATIONS_PATH,
  notificationsUrl,
  pageUrl,
  profileUrl,
  type Area,
} from '@constants/areas';
import { unreadCountQuery } from '@lib/api/notifications-api';
import { useNavBadges } from './useNavBadges';

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

const BADGE_WORDS: Record<string, [string, string]> = {
  notificacoes: ['não lida', 'não lidas'],
  agendamentos: ['agendado', 'agendados'],
};

export const badgeText = ({ key, badge = 0 }: NavItem) => {
  const [one, many] = BADGE_WORDS[key] ?? ['pendente', 'pendentes'];
  return `${badge} ${badge === 1 ? one : many}`;
};

const POLL_INTERVAL_MS = 120_000;

export function useUnreadCount(role: Area['role']): number {
  return (
    useQuery({
      ...unreadCountQuery(role),
      refetchInterval: POLL_INTERVAL_MS,
      refetchIntervalInBackground: false,
    }).data ?? 0
  );
}

export function useNavItems(area: Area) {
  const { pathname } = useLocation();
  const badges = useNavBadges(area.role);
  const unread = useUnreadCount(area.role);
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
  const fabPage = area.fab && findPage(area, area.fab.path);
  return { menu, account, tabs: tabs.length < 4 ? [...tabs, ...account] : tabs, fab: fabPage && area.fab };
}
