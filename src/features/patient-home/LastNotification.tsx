import { useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { LuBell, LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { IconSlot } from '@components/ui';
import type { UserNotification } from '@lib/api/models';
import { formatRelative } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { markNotificationRead } from './patient-home-api';

export function LastNotification({ notification }: { notification: UserNotification }) {
  const titleId = useId();
  const queryClient = useQueryClient();
  const { title, body } = notificationText(notification);
  const unread = notification.readAt === null;

  const markRead = () => {
    if (!unread) return;
    void markNotificationRead(notification.id).then(
      () => queryClient.invalidateQueries({ queryKey: queryKeys.patient.home }),
      () => undefined,
    );
  };

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        Última notificação
      </h2>
      <Link
        to={notificationTarget(notification, 'patient')}
        onClick={markRead}
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
