import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { LuCalendarCheck, LuCalendarX, LuClock, LuPlus, LuSyringe } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import {
  ButtonLink,
  Card,
  EmptyState,
  Pagination,
  QueryError,
  Skeleton,
  TabPanel,
  Tabs,
} from '@components/ui';
import { areas } from '@constants/areas';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import { useSearchParam } from '@hooks/useSearchParam';
import { cx } from '@lib/cx';
import { queryKeys } from '@lib/query-keys';
import { BookingCard } from './BookingCard';
import { bookingsApi, type BookingListParams, type PatientBooking } from './bookings-api';
import { CancelDialog } from './CancelDialog';

const PATIENT = areas.patient.base;
const TABS_ID = 'patient-bookings';
const RESET_PAGE = { replace: true, reset: ['pagina'] } as const;

const TABS = [
  {
    value: 'agendados',
    label: 'Agendados',
    scope: 'upcoming',
    icon: <LuCalendarCheck />,
    empty: {
      title: 'Nenhum agendamento futuro',
      description: 'Agende uma consulta ou um exame para acompanhar por aqui.',
    },
  },
  {
    value: 'realizados',
    label: 'Realizados',
    scope: 'past',
    icon: <LuClock />,
    empty: {
      title: 'Nenhum agendamento realizado',
      description: 'Consultas e exames passados ou cancelados aparecem aqui.',
    },
  },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const found = (total: number) => (total === 1 ? '1 agendamento' : `${total} agendamentos`);

function Shortcuts({ className }: { className?: string }) {
  return (
    <nav aria-label="Novo agendamento" className={cx('grid grid-cols-2 gap-3 lg:max-w-md', className)}>
      <ButtonLink to={`${PATIENT}/consultas/nova`} size="lg" className="px-3 text-base">
        <LuPlus aria-hidden />
        Nova Consulta
      </ButtonLink>
      <ButtonLink to={`${PATIENT}/exames/novo`} variant="secondary" size="lg" className="px-3 text-base">
        <LuSyringe aria-hidden />
        Novo Exame
      </ButtonLink>
    </nav>
  );
}

export function PatientBookingsPage() {
  const [page, setPage] = usePageParam();
  const [tabParam, setTabParam] = useSearchParam('aba', 'agendados');
  const tab = TABS.find((item) => item.value === tabParam) ?? TABS[0];
  const params: BookingListParams = { scope: tab.scope, page };
  const query = useQuery({
    queryKey: queryKeys.patient.bookings(params),
    queryFn: ({ signal }) => bookingsApi.list(params, signal),
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[2] as BookingListParams | undefined)?.scope === tab.scope
        ? previous
        : undefined,
  });
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);
  const [cancelling, setCancelling] = useState<PatientBooking | null>(null);
  const results = useRef<HTMLParagraphElement>(null);
  const counts = query.data?.counts;
  const items = outOfRange ? undefined : query.data?.items;

  return (
    <>
      <PageHeader title="Minhas consultas e exames" back backFallback={PATIENT} />
      <div className="flex flex-col gap-5">
        <Tabs<TabValue>
          id={TABS_ID}
          label="Agendamentos"
          variant="tile"
          items={TABS.map(({ value, label, scope, icon }) => ({
            value,
            label,
            icon,
            count: counts ? counts[scope] : '–',
          }))}
          value={tab.value}
          onValueChange={(value) => setTabParam(value, RESET_PAGE)}
          className="lg:max-w-md"
        />
        <TabPanel tabsId={TABS_ID} value={tab.value} className="flex flex-col gap-4">
          <p
            ref={results}
            tabIndex={-1}
            aria-live="polite"
            className="text-text-secondary text-sm focus-visible:outline-none"
          >
            {query.data && !outOfRange && query.data.total > 0 ? found(query.data.total) : null}
          </p>
          {query.isPending && (
            <div aria-busy="true" className="grid gap-3 lg:grid-cols-2">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          )}
          {query.isError && <QueryError error={query.error} onRetry={() => void query.refetch()} />}
          {items?.length === 0 && (
            <Card>
              <EmptyState
                icon={<LuCalendarX />}
                {...tab.empty}
                action={<Shortcuts className="grid-cols-1 sm:grid-cols-2" />}
              />
            </Card>
          )}
          {items && items.length > 0 && (
            <>
              <Card className="p-4 sm:p-6">
                <ul className="grid items-start gap-3 lg:grid-cols-2">
                  {items.map((booking) => (
                    <li key={booking.id}>
                      <BookingCard booking={booking} onCancel={setCancelling} />
                    </li>
                  ))}
                </ul>
              </Card>
              <Pagination page={page} totalPages={lastPage} onPageChange={(next) => setPage(next)} />
              <Shortcuts />
            </>
          )}
        </TabPanel>
      </div>
      <CancelDialog booking={cancelling} onClose={() => setCancelling(null)} fallbackFocus={results} />
    </>
  );
}
