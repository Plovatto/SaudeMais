import { LuBell } from 'react-icons/lu';
import { IconSlot } from '@components/ui';
import type { UserNotification } from '@lib/api/models';
import { formatRelative } from '@lib/date';
import { notificationText } from '@lib/messages/notifications.pt-BR';

const TITLE_ID = 'last-notification-title';

export function LastNotification({ notification }: { notification: UserNotification }) {
  const { title, body } = notificationText(notification);
  const unread = notification.readAt === null;

  return (
    <section
      aria-labelledby={TITLE_ID}
      className="rounded-card border-role/30 bg-role-soft shadow-card flex items-start gap-3 border p-4"
    >
      <h2 id={TITLE_ID} className="sr-only">
        Última notificação
      </h2>
      <IconSlot className="bg-surface text-role-text size-10 justify-center rounded-full text-xl">
        <LuBell />
      </IconSlot>
      <div className="text-text flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-semibold">
          {title}
          {unread && <span className="sr-only"> (não lida)</span>}
        </p>
        <p className="text-sm break-words">{body}</p>
        <time dateTime={notification.createdAt} className="text-xs">
          {formatRelative(notification.createdAt)}
        </time>
      </div>
      {unread && <span aria-hidden className="bg-role-strong mt-2 size-2.5 shrink-0 rounded-full" />}
    </section>
  );
}
