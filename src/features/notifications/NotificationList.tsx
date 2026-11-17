import type { UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';
import type { IconType } from 'react-icons';
import {
  LuBell,
  LuBellOff,
  LuCalendarClock,
  LuCalendarPlus,
  LuCheck,
  LuClock,
  LuFileText,
  LuUserPlus,
  LuX,
} from 'react-icons/lu';
import { Link } from 'react-router';
import { EmptyState, QueryError, Skeleton } from '@components/ui';
import type { Role } from '@constants/areas';
import type { UserNotification } from '@lib/api/models';
import { useMarkNotificationRead, type NotificationPage } from '@lib/api/notifications-api';
import { cx } from '@lib/cx';
import { groupHeader, sectionPad, softTones, type SoftTone } from '@components/ui/styles';
import { civilDateInSaoPaulo, formatDateTime, formatSince, todayInSaoPaulo } from '@lib/date';
import { notificationTarget, notificationText } from '@lib/messages/notifications.pt-BR';

interface Visual {
  icon: IconType;
  tone: SoftTone;
}

const cancelled: Visual = { icon: LuX, tone: 'danger' };

const visuals: Record<UserNotification['type'], Visual> = {
  appointment_requested: { icon: LuCalendarPlus, tone: 'warning' },
  appointment_rescheduled: { icon: LuCalendarClock, tone: 'warning' },
  appointment_cancelled_by_patient: cancelled,
  appointment_confirmed: { icon: LuCheck, tone: 'success' },
  appointment_cancelled: cancelled,
  appointment_expired: { icon: LuClock, tone: 'warning' },
  exam_result_available: { icon: LuFileText, tone: 'accent' },
  user_registered: { icon: LuUserPlus, tone: 'accent' },
};

const fallbackVisual: Visual = { icon: LuBell, tone: 'info' };

export type NotificationVariant = 'page' | 'popover';

const looks = {
  page: {
    group: 'border-border border-t first:border-t-0',
    day: cx(groupHeader, 'text-text-muted text-xs font-semibold'),
    list: 'divide-border divide-y',
    row: 'can-hover:bg-surface-muted items-start gap-3.5 px-4 py-4 lg:px-5',
    read: '',
    unread: '',
    icon: 'size-10 rounded-[11px] [&_svg]:size-[18px]',
    badge: 'ring-surface size-[11px]',
    body: 'flex flex-col gap-0.5',
    title: 'text-sm',
    text: 'text-[0.8125rem]',
    time: 'mt-1 text-xs',
  },
  popover: {
    group: '',
    day: 'text-text-muted px-4 pt-2 pb-0.5 text-[0.65625rem] font-semibold tracking-[0.06em] uppercase',
    list: 'flex flex-col gap-0.5',
    row: 'mx-1.5 items-center gap-2.5 rounded-[10px] py-2 ps-3 pe-2.5',
    read: 'can-hover:bg-surface-muted',
    unread: 'bg-role-soft/55 can-hover:bg-role-soft',
    icon: 'size-7 rounded-full [&_svg]:size-3.5',
    badge: 'size-[9px] ring-[color-mix(in_oklab,var(--role-soft)_55%,var(--surface))]',
    body: 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-0.5',
    title: 'text-[0.8125rem]',
    text: 'col-span-full line-clamp-2 text-xs leading-[1.45]',
    time: 'col-start-2 row-start-1 mt-px text-[0.6875rem]',
  },
};

interface ItemProps {
  notification: UserNotification;
  role: Role;
  variant: NotificationVariant;
}

function NotificationItem({ notification, role, variant }: ItemProps) {
  const markRead = useMarkNotificationRead();
  const { title, body } = notificationText(notification);
  const { icon: Icon, tone } = visuals[notification.type] ?? fallbackVisual;
  const unread = notification.readAt === null;
  const look = looks[variant];
  return (
    <Link
      to={notificationTarget(notification, role)}
      onClick={() => markRead(notification)}
      className={cx(
        'flex min-h-11 min-w-0 transition-colors duration-150',
        look.row,
        unread ? look.unread : look.read,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'relative grid shrink-0 place-items-center',
          look.icon,
          softTones[tone],
          variant === 'popover' && !unread && 'opacity-80 saturate-[0.4]',
        )}
      >
        <Icon />
        {unread && (
          <span
            className={cx('bg-role-strong absolute -end-0.5 -top-0.5 rounded-full ring-[2.5px]', look.badge)}
          />
        )}
      </span>
      <span className={cx('min-w-0 flex-1', look.body)}>
        <span
          className={cx(
            'leading-[1.35]',
            look.title,
            unread ? 'text-text font-[650]' : 'text-text-secondary font-medium',
          )}
        >
          {title}
          {unread && <span className="sr-only"> (não lida)</span>}
        </span>
        <span className={cx('text-text-secondary break-words', look.text)}>{body}</span>
        <time
          dateTime={notification.createdAt}
          title={formatDateTime(notification.createdAt)}
          className={cx(
            'block whitespace-nowrap',
            unread ? 'text-text-secondary' : 'text-text-muted',
            look.time,
          )}
        >
          {formatSince(notification.createdAt)}
        </time>
      </span>
    </Link>
  );
}

interface Group {
  day: string;
  items: UserNotification[];
}

function groupByRecency(items: UserNotification[], perGroup: number): Group[] {
  const today = todayInSaoPaulo();
  const isToday = (item: UserNotification) => civilDateInSaoPaulo(new Date(item.createdAt)) === today;
  return [
    { day: 'Hoje', items: items.filter(isToday) },
    { day: 'Anteriores', items: items.filter((item) => !isToday(item)) },
  ]
    .map((group) => ({ ...group, items: group.items.slice(0, perGroup) }))
    .filter((group) => group.items.length > 0);
}

interface GroupProps {
  group: Group;
  role: Role;
  variant: NotificationVariant;
}

function NotificationGroup({ group, role, variant }: GroupProps) {
  const dayId = useId();
  const look = looks[variant];
  const Heading = variant === 'page' ? 'h2' : 'h3';
  return (
    <div className={look.group}>
      <Heading id={dayId} className={look.day}>
        {group.day}
      </Heading>
      <ul aria-labelledby={dayId} className={look.list}>
        {group.items.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} role={role} variant={variant} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface NotificationListProps {
  query: UseQueryResult<NotificationPage>;
  role: Role;
  variant: NotificationVariant;
  placeholders: number;
  perGroup?: number;
}

export function NotificationList({
  query,
  role,
  variant,
  placeholders,
  perGroup = Number.POSITIVE_INFINITY,
}: NotificationListProps) {
  const padding = variant === 'page' ? sectionPad : 'px-4 py-3';
  if (query.isPending) {
    return (
      <div aria-busy="true" className={cx('flex flex-col gap-2', padding)}>
        {Array.from({ length: placeholders }, (_, index) => (
          <Skeleton key={index} className={variant === 'page' ? 'h-16' : 'h-12'} />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className={padding}>
        <QueryError error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }
  if (query.data.items.length === 0) {
    return (
      <EmptyState
        icon={<LuBellOff />}
        title="Nenhuma notificação"
        description="Quando houver novidades, elas aparecem aqui."
        className="px-4 py-8"
      />
    );
  }
  return groupByRecency(query.data.items, perGroup).map((group) => (
    <NotificationGroup key={group.day} group={group} role={role} variant={variant} />
  ));
}
