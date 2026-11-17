import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LuBell } from 'react-icons/lu';
import { ButtonLink, CountBadge, Popover } from '@components/ui';
import { notificationsUrl, type Role } from '@constants/areas';
import { notificationsQuery, unreadText, useUnreadCount } from '@lib/api/notifications-api';
import { NotificationList } from './NotificationList';
import { ReadAllButton } from './ReadAllButton';

const PREVIEW_SIZE = 5;
const BADGE_MAX = 9;

function NotificationsPreview({ role }: { role: Role }) {
  const query = useQuery(notificationsQuery(role, 1, PREVIEW_SIZE));
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-text font-semibold">Notificações</h2>
        <ReadAllButton role={role} />
      </div>
      <NotificationList query={query} role={role} placeholders={3} />
      <ButtonLink to={notificationsUrl(role)} variant="ghost" fullWidth>
        Ver todas
      </ButtonLink>
    </>
  );
}

function useIncreaseAnnouncement(count: number | undefined) {
  const [previous, setPrevious] = useState(count);
  const [pending, setPending] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  if (count !== previous) {
    setPrevious(count);
    if (count !== undefined && previous !== undefined && count > previous) {
      setAnnouncement('');
      setPending(`Nova notificação. ${unreadText(count)}.`);
    }
  }
  useEffect(() => {
    if (pending === null) return;
    const timer = setTimeout(() => {
      setAnnouncement(pending);
      setPending(null);
    });
    return () => clearTimeout(timer);
  }, [pending]);
  return announcement;
}

export function NotificationBell({ role }: { role: Role }) {
  const count = useUnreadCount(role);
  const announcement = useIncreaseAnnouncement(count);
  const unread = count ?? 0;
  return (
    <>
      <Popover
        label={unread > 0 ? `Notificações, ${unreadText(unread)}` : 'Notificações'}
        title="Notificações"
        icon={<LuBell />}
        badge={
          unread > 0 && (
            <CountBadge className="bg-danger-strong text-on-danger -end-0.5 -top-0.5">
              {unread > BADGE_MAX ? `${BADGE_MAX}+` : unread}
            </CountBadge>
          )
        }
        panelClassName="flex flex-col gap-3"
      >
        <NotificationsPreview role={role} />
      </Popover>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
