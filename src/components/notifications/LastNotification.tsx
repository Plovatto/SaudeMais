import type { Role } from '@constants/areas';
import type { UserNotification } from '@lib/api/models';
import { useMarkNotificationRead } from '@lib/api/notifications-api';
import { formatRelative } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';
import { NoticeLink } from './NoticeLink';

export interface LastNotificationProps {
  notification: UserNotification;
  role: Role;
}

export function LastNotification({ notification, role }: LastNotificationProps) {
  const markRead = useMarkNotificationRead();
  const { title, body } = notificationText(notification);
  const unread = notification.readAt === null;

  return (
    <NoticeLink
      label="Última notificação"
      to={notificationTarget(notification, role)}
      onClick={() => markRead(notification)}
      title={
        <>
          {title}
          {unread && <span className="sr-only"> (não lida)</span>}
        </>
      }
      body={body}
      meta={
        <time dateTime={notification.createdAt} className="text-xs">
          {formatRelative(notification.createdAt)}
        </time>
      }
      marker={unread && <span aria-hidden className="bg-role-strong mt-2 size-2.5 shrink-0 rounded-full" />}
    />
  );
}
