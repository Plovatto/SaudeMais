import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { Role } from '@constants/areas';
import type { UserNotification } from '@lib/api/models';
import { markNotificationRead } from '@lib/api/notifications-api';
import { formatRelative } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';
import { NoticeLink } from './NoticeLink';

export interface LastNotificationProps {
  notification: UserNotification;
  role: Role;
  homeKey: QueryKey;
}

export function LastNotification({ notification, role, homeKey }: LastNotificationProps) {
  const queryClient = useQueryClient();
  const { title, body } = notificationText(notification);
  const unread = notification.readAt === null;

  const markRead = () => {
    if (!unread) return;
    void markNotificationRead(notification.id).then(
      () => queryClient.invalidateQueries({ queryKey: homeKey }),
      () => undefined,
    );
  };

  return (
    <NoticeLink
      label="Última notificação"
      to={notificationTarget(notification, role)}
      onClick={markRead}
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
