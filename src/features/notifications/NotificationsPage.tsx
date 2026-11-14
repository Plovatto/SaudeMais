import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@components/layout/PageHeader';
import { useAreaRole } from '@components/layout/route-handle';
import { Card, Pagination } from '@components/ui';
import { areas } from '@constants/areas';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import { notificationsQuery } from '@lib/api/notifications-api';
import { NotificationList } from './NotificationList';
import { ReadAllButton } from './ReadAllButton';

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const role = useAreaRole();
  const area = areas[role];
  const [page, setPage] = usePageParam();
  const query = useQuery(notificationsQuery(role, page, PAGE_SIZE));
  const { lastPage } = useClampedPage(page, setPage, query.data);
  return (
    <>
      <PageHeader title="Notificações" subtitle={`Perfil ${area.label}`} back backFallback={area.base} />
      <div className="flex flex-col gap-4 lg:max-w-2xl">
        <Card className="flex flex-col gap-3 p-4 sm:p-6">
          <div className="flex justify-end">
            <ReadAllButton role={role} />
          </div>
          <NotificationList query={query} role={role} placeholders={4} />
        </Card>
        <Pagination page={page} totalPages={lastPage} onPageChange={(next) => setPage(next)} />
      </div>
    </>
  );
}
