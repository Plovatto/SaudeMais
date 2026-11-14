import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LuBell } from 'react-icons/lu';
import { ButtonLink, Popover } from '@components/ui';
import { notificationsUrl, type Role } from '@constants/areas';
import { notificationsQuery, unreadCountQuery } from '@lib/api/notifications-api';
import { NotificationList } from './NotificationList';
import { ReadAllButton } from './ReadAllButton';

const PREVIEW_SIZE = 5;
const BADGE_MAX = 9;

const unreadText = (count: number) => (count === 1 ? '1 não lida' : `${count} não lidas`);

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
  const [announcement, setAnnouncement] = useState('');
  if (count !== previous) {
    setPrevious(count);
    if (count !== undefined && previous !== undefined && count > previous) {
      setAnnouncement(`Nova notificação. ${unreadText(count)}.`);
    }
  }
  return announcement;
}

export function NotificationBell({ role }: { role: Role }) {
  const count = useQuery(unreadCountQuery(role)).data;
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
            <span
              aria-hidden
              className="bg-danger-strong text-on-danger absolute -end-0.5 -top-0.5 h-5 min-w-5 rounded-full px-1 text-[0.6875rem] leading-5 font-bold"
            >
              {unread > BADGE_MAX ? `${BADGE_MAX}+` : unread}
            </span>
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
