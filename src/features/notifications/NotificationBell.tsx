import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { LuArrowRight, LuBell } from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { CloseButton, CountBadge, IconLink, Popover } from '@components/ui';
import { NOTIFICATIONS_PATH, notificationsUrl, type Role } from '@constants/areas';
import { notificationsQuery, unreadText, useUnreadCount } from '@lib/api/notifications-api';
import { footerBar } from '@components/ui/styles';
import { cx } from '@lib/cx';
import { NotificationList } from './NotificationList';
import { ReadAllButton } from './ReadAllButton';
import { plural } from '@lib/plural';

const PREVIEW_SIZE = 6;
const PER_GROUP = 3;
const BADGE_MAX = 9;

const newText = (count: number) => plural(count, 'nova', 'novas');

interface PreviewProps {
  role: Role;
  unread: number | undefined;
  close: () => void;
}

function NotificationsPreview({ role, unread, close }: PreviewProps) {
  const query = useQuery(notificationsQuery(role, 1, PREVIEW_SIZE));
  const doneRef = useRef<HTMLSpanElement>(null);
  return (
    <>
      <div className="border-border flex items-center gap-2 border-b py-3 ps-4 pe-2.5">
        <h2 className="text-text text-[0.90625rem] font-semibold">Notificações</h2>
        {!!unread && (
          <span className="bg-role-strong text-on-role rounded-full px-[7px] py-px text-[0.65625rem] font-[650] whitespace-nowrap">
            {newText(unread)}
          </span>
        )}
        <ReadAllButton role={role} unread={unread} focusAfter={doneRef} compact />
        {unread === 0 && (
          <span ref={doneRef} tabIndex={-1} className="text-text-muted ms-auto px-1.5 text-xs">
            Tudo lido
          </span>
        )}
        <CloseButton
          label="Fechar notificações"
          onClick={close}
          className="text-text-muted size-7 lg:size-7 [&_svg]:size-4"
        />
      </div>
      <div className="max-h-[min(360px,60vh)] overflow-y-auto pt-0.5 pb-1.5">
        <NotificationList query={query} role={role} variant="popover" placeholders={3} perGroup={PER_GROUP} />
      </div>
      <Link
        to={notificationsUrl(role)}
        className={cx(
          footerBar,
          'text-role-text can-hover:bg-surface-strong flex items-center justify-center gap-1.5 p-2.5 text-[0.78125rem] font-semibold transition-colors duration-150',
        )}
      >
        Ver todas as notificações
        <LuArrowRight aria-hidden className="size-3.5" />
      </Link>
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

function BellBadge({ unread }: { unread: number }) {
  if (unread === 0) return null;
  return (
    <CountBadge className="bg-danger-strong text-on-danger ring-canvas pointer-events-none end-0.5 top-[3px] h-4 min-w-4 px-1 text-[0.625rem] leading-4 ring-2">
      {unread > BADGE_MAX ? `${BADGE_MAX}+` : unread}
    </CountBadge>
  );
}

const bellIcon = <LuBell />;

const caret =
  "before:border-border before:bg-surface before:absolute before:-top-1.5 before:end-[22px] before:z-[2] before:size-3 before:rotate-45 before:rounded-tl-[3px] before:border-s before:border-t before:content-[''] lg:before:end-3.5";

export function NotificationBell({ role }: { role: Role }) {
  const count = useUnreadCount(role);
  const announcement = useIncreaseAnnouncement(count);
  const { pathname } = useLocation();
  const unread = count ?? 0;
  const label = unread > 0 ? `Notificações, ${unreadText(unread)}` : 'Notificações';
  return (
    <>
      {pathname === NOTIFICATIONS_PATH ? (
        <IconLink to={notificationsUrl(role)} label={label} icon={bellIcon} aria-current="page">
          <BellBadge unread={unread} />
        </IconLink>
      ) : (
        <Popover
          label={label}
          title="Notificações"
          icon={bellIcon}
          badge={<BellBadge unread={unread} />}
          panelClassName={cx(
            'mt-1.5 -me-1.5 w-[min(320px,calc(100vw-20px))] p-0 lg:me-0 lg:w-[360px]',
            caret,
          )}
        >
          {(close) => <NotificationsPreview role={role} unread={count} close={close} />}
        </Popover>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
