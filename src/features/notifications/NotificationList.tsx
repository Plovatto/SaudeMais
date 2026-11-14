import type { UseQueryResult } from '@tanstack/react-query';
import type { IconType } from 'react-icons';
import {
  LuBell,
  LuBellOff,
  LuCalendarClock,
  LuCalendarX,
  LuCircleCheck,
  LuFileText,
  LuUserPlus,
} from 'react-icons/lu';
import { Link } from 'react-router';
import { EmptyState, IconSlot, QueryError, Skeleton } from '@components/ui';
import type { Role } from '@constants/areas';
import type { UserNotification } from '@lib/api/models';
import { useMarkNotificationRead, type NotificationPage } from '@lib/api/notifications-api';
import { cx } from '@lib/cx';
import { formatRelative } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';

const tones = {
  role: 'bg-role-strong text-on-role',
  success: 'bg-success-strong text-on-success',
  danger: 'bg-danger-strong text-on-danger',
};

interface Visual {
  icon: IconType;
  tone: keyof typeof tones;
}

const cancelled: Visual = { icon: LuCalendarX, tone: 'danger' };
const requested: Visual = { icon: LuCalendarClock, tone: 'role' };

const visuals: Record<UserNotification['type'], Visual> = {
  appointment_requested: requested,
  appointment_rescheduled: requested,
  appointment_cancelled_by_patient: cancelled,
  appointment_confirmed: { icon: LuCircleCheck, tone: 'success' },
  appointment_cancelled: cancelled,
  appointment_expired: cancelled,
  exam_result_available: { icon: LuFileText, tone: 'role' },
  user_registered: { icon: LuUserPlus, tone: 'role' },
};

const fallbackVisual: Visual = { icon: LuBell, tone: 'role' };

function NotificationItem({ notification, role }: { notification: UserNotification; role: Role }) {
  const markRead = useMarkNotificationRead();
  const { title, body } = notificationText(notification);
  const { icon: Icon, tone } = visuals[notification.type] ?? fallbackVisual;
  const unread = notification.readAt === null;
  return (
    <Link
      to={notificationTarget(notification, role)}
      onClick={() => markRead(notification)}
      className={cx(
        'rounded-tile border-border can-hover:border-role flex min-h-11 items-start gap-3 border p-3 transition-colors',
        unread ? 'bg-surface' : 'bg-surface-muted',
      )}
    >
      <IconSlot
        className={cx(
          'mt-0.5 size-8 justify-center rounded-full text-base',
          unread ? tones[tone] : 'bg-border text-text-secondary',
        )}
      >
        <Icon />
      </IconSlot>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cx('text-sm font-semibold', unread ? 'text-text' : 'text-text-secondary')}>
            {title}
            {unread && <span className="sr-only"> (não lida)</span>}
          </span>
          <time dateTime={notification.createdAt} className="text-text-secondary shrink-0 text-xs">
            {formatRelative(notification.createdAt)}
          </time>
        </span>
        <span className="text-text-secondary text-xs break-words">{body}</span>
      </span>
      {unread && <span aria-hidden className="bg-role-strong mt-2 size-2 shrink-0 rounded-full" />}
    </Link>
  );
}

export interface NotificationListProps {
  query: UseQueryResult<NotificationPage>;
  role: Role;
  placeholders: number;
}

export function NotificationList({ query, role, placeholders }: NotificationListProps) {
  if (query.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-2">
        {Array.from({ length: placeholders }, (_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>
    );
  }
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data.items.length === 0) {
    return (
      <EmptyState
        icon={<LuBellOff />}
        title="Nenhuma notificação"
        description="Quando houver novidades, elas aparecem aqui."
        className="py-6"
      />
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {query.data.items.map((notification) => (
        <li key={notification.id}>
          <NotificationItem notification={notification} role={role} />
        </li>
      ))}
    </ul>
  );
}
