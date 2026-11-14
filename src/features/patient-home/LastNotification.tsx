import { useId } from 'react';
import { LuBell, LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { IconSlot } from '@components/ui';
import type { UserNotification } from '@lib/api/models';
import { useMarkNotificationRead } from '@lib/api/notifications-api';
import { formatRelative } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';

export function LastNotification({ notification }: { notification: UserNotification }) {
  const titleId = useId();
  const markRead = useMarkNotificationRead();
  const { title, body } = notificationText(notification);
  const unread = notification.readAt === null;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        Última notificação
      </h2>
      <Link
        to={notificationTarget(notification, 'patient')}
        onClick={() => markRead(notification)}
        className="rounded-card border-role/30 bg-role-soft shadow-card text-text can-hover:border-role flex min-h-11 items-start gap-3 border p-4 transition-colors"
      >
        <IconSlot className="bg-surface text-role-text size-10 justify-center rounded-full text-xl">
          <LuBell />
        </IconSlot>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold">
            {title}
            {unread && <span className="sr-only"> (não lida)</span>}
          </span>
          <span className="text-sm break-words">{body}</span>
          <time dateTime={notification.createdAt} className="text-xs">
            {formatRelative(notification.createdAt)}
          </time>
        </span>
        {unread && <span aria-hidden className="bg-role-strong mt-2 size-2.5 shrink-0 rounded-full" />}
        <IconSlot className="text-role-text self-center text-xl">
          <LuChevronRight />
        </IconSlot>
      </Link>
    </section>
  );
}
