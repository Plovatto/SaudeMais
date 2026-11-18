import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { PageColumn } from '@components/layout/PageColumn';
import { PageHeader } from '@components/layout/PageHeader';
import { useAreaRole } from '@components/layout/route-handle';
import { Card, Pagination, Skeleton } from '@components/ui';
import { headerBar } from '@components/ui/styles';
import { areas, type Role } from '@constants/areas';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import { notificationsQuery, unreadCountQuery, unreadNoun } from '@lib/api/notifications-api';
import { cx } from '@lib/cx';
import { NotificationList } from './NotificationList';
import { ReadAllButton } from './ReadAllButton';

const PAGE_SIZE = 20;

const subtitles: Record<Role, string> = {
  patient: 'Avisos sobre seus agendamentos e resultados.',
  doctor: 'Avisos sobre pedidos e mudanças na sua agenda.',
  admin: 'Avisos sobre cadastros e a operação da clínica.',
};

function UnreadSummary({ role }: { role: Role }) {
  const unread = useQuery(unreadCountQuery(role)).data;
  const summaryRef = useRef<HTMLParagraphElement>(null);
  return (
    <div className={cx(headerBar, 'border-border border-b py-2.5')}>
      <p ref={summaryRef} tabIndex={-1} className="text-text-secondary min-w-0 flex-1 text-[0.8125rem]">
        {unread === undefined ? (
          <Skeleton className="h-4 w-20" />
        ) : unread > 0 ? (
          <>
            <b className="text-role-text font-bold">{unread}</b> {unreadNoun(unread)}
          </>
        ) : (
          'Tudo lido'
        )}
      </p>
      <ReadAllButton role={role} unread={unread} focusAfter={summaryRef} />
    </div>
  );
}

export function NotificationsPage() {
  const role = useAreaRole();
  const [page, setPage] = usePageParam();
  const query = useQuery(notificationsQuery(role, page, PAGE_SIZE));
  const { lastPage } = useClampedPage(page, setPage, query.data);
  return (
    <PageColumn>
      <PageHeader title="Notificações" subtitle={subtitles[role]} back backFallback={areas[role].base} />
      <div className="flex flex-col gap-4">
        <Card
          role="region"
          aria-label={`Notificações do perfil ${areas[role].label}`}
          className="min-w-0 overflow-hidden p-0"
        >
          <UnreadSummary role={role} />
          <NotificationList query={query} role={role} variant="page" placeholders={4} />
        </Card>
        <Pagination page={page} totalPages={lastPage} onPageChange={(next) => setPage(next)} />
      </div>
    </PageColumn>
  );
}
