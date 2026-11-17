import { useId } from 'react';
import { LuBell } from 'react-icons/lu';
import { ListRow } from '@components/ui';
import { tile } from '@components/ui/styles';
import type { Role } from '@constants/areas';
import type { UserNotification } from '@lib/api/models';
import { useMarkNotificationRead } from '@lib/api/notifications-api';
import { formatRelative } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';

export interface LastNotificationProps {
  notification: UserNotification;
  role: Role;
}

export function LastNotification({ notification, role }: LastNotificationProps) {
  const labelId = useId();
  const markRead = useMarkNotificationRead();
  const { title, body } = notificationText(notification);
  const unread = notification.readAt === null;

  return (
    <section aria-labelledby={labelId}>
      <h2 id={labelId} className="sr-only">
        Última notificação
      </h2>
      <ListRow
        to={notificationTarget(notification, role)}
        onClick={() => markRead(notification)}
        className="rounded-card border-border bg-surface shadow-card border"
        leading={
          <span aria-hidden className={tile}>
            <LuBell />
          </span>
        }
        title={
          <span className="flex min-w-0 flex-wrap items-center gap-x-2">
            <span>{title}</span>
            {unread && (
              <>
                <span aria-hidden className="bg-role-strong size-2 shrink-0 rounded-full" />
                <span className="sr-only"> (não lida)</span>
              </>
            )}
          </span>
        }
        meta={<span className="line-clamp-2 break-words lg:line-clamp-1">{body}</span>}
        trailing={
          <time dateTime={notification.createdAt} className="text-text-muted shrink-0 text-xs">
            {formatRelative(notification.createdAt)}
          </time>
        }
      />
    </section>
  );
}
