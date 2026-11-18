import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { LuCalendarX, LuFilterX, LuPlus } from 'react-icons/lu';
import { BookingRow } from '@components/bookings/BookingRow';
import { DetailPane } from '@components/bookings/DetailPane';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, ButtonLink, EmptyState, TabPanel, Tabs } from '@components/ui';
import { groupHeader, overline } from '@components/ui/styles';
import { areas, BOOK_APPOINTMENT_PATH, BOOKING_PARAM } from '@constants/areas';
import { useListSelection } from '@hooks/useListSelection';
import { resetPageAnd } from '@hooks/usePageParam';
import { useSearchParam, useSetSearchParams } from '@hooks/useSearchParam';
import { useTabbedList } from '@hooks/useTabbedList';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatMonth } from '@lib/date';
import { groupConsecutive } from '@lib/group';
import { queryKeys } from '@lib/query-keys';
import { BookingDetail } from './BookingDetail';
import {
  activeCount,
  filterQuery,
  normalizeFilters,
  NO_FILTERS,
  type BookingFilters,
} from './booking-filters';
import { BookingsFilter } from './BookingsFilter';
import { getBooking, listBookings, type BookingListParams } from './bookings-api';
import { CancelDialog } from './CancelDialog';
import { plural } from '@lib/plural';

const BOOK_URL = `${areas.patient.base}/${BOOK_APPOINTMENT_PATH}`;
const TABS_ID = 'patient-bookings';
const RESET_SELECTION = [BOOKING_PARAM];

const TABS = [
  {
    value: 'agendados',
    label: 'Próximos',
    scope: 'upcoming',
    empty: { title: 'Nada por aqui', description: 'Seus próximos agendamentos aparecem nesta lista.' },
  },
  {
    value: 'realizados',
    label: 'Histórico',
    scope: 'past',
    empty: {
      title: 'Nenhum agendamento no histórico',
      description: 'Consultas e exames passados ou cancelados aparecem aqui.',
    },
  },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const count = (total: number) => plural(total, 'agendamento', 'agendamentos');

export function PatientBookingsPage() {
  const [tipo] = useSearchParam('tipo');
  const [status] = useSearchParam('status');
  const setParams = useSetSearchParams();
  const detailId = useId();
  const raw = { tipo, status };
  const list = useTabbedList(
    TABS,
    ({ scope }, page) => {
      const params: BookingListParams = { scope, page, ...filterQuery(scope, raw) };
      return {
        queryKey: queryKeys.patient.bookings(params),
        queryFn: (signal: AbortSignal) => listBookings(params, signal),
      };
    },
    RESET_SELECTION,
  );
  const [cancelling, setCancelling] = useState<PatientBooking | null>(null);
  const results = useRef<HTMLParagraphElement>(null);
  const counts = list.lastData?.counts;
  const valid = normalizeFilters(list.tab.scope, raw);
  const filtered = activeCount(valid) > 0 && !list.query.isPlaceholderData;
  const found = (total: number) => (filtered ? `${count(total)} com esses filtros` : count(total));
  const applyFilters = (next: BookingFilters) => setParams(next, resetPageAnd(RESET_SELECTION));
  const clearFilters = () => {
    applyFilters(NO_FILTERS);
    results.current?.focus();
  };
  const [selectedId, setSelectedId] = useSearchParam(BOOKING_PARAM);
  const listed = list.items?.find((booking) => booking.id === selectedId);
  const settled = list.items !== undefined && !list.query.isPlaceholderData && !list.query.isFetching;
  const loaded = useQuery({
    queryKey: queryKeys.patient.bookingById(selectedId),
    queryFn: ({ signal }) => getBooking(selectedId, signal),
    enabled: settled && selectedId !== '' && !listed,
  });
  const extra = !listed && loaded.data?.id === selectedId ? loaded.data : undefined;
  const resolving = selectedId !== '' && !listed && !extra;
  const candidates = extra && list.items ? [...list.items, extra] : list.items;
  const { desktop, selected, select, closeSheet } = useListSelection(
    BOOKING_PARAM,
    resolving ? undefined : candidates,
  );

  useEffect(() => {
    if (selectedId && !listed && loaded.isError) setSelectedId('', { replace: true });
  }, [selectedId, listed, loaded.isError, setSelectedId]);

  useEffect(() => {
    if (valid.tipo !== tipo || valid.status !== status) {
      setParams({ tipo: valid.tipo, status: valid.status }, { replace: true });
    }
  }, [valid.tipo, valid.status, tipo, status, setParams]);

  return (
    <>
      <PageHeader
        title="Meus agendamentos"
        subtitle="Suas consultas e exames em um só lugar."
        action={
          <ButtonLink to={BOOK_URL} className="max-lg:hidden">
            <LuPlus aria-hidden />
            Agendar consulta
          </ButtonLink>
        }
      />
      <div className="flex items-end gap-3">
        <Tabs<TabValue>
          id={TABS_ID}
          label="Agendamentos"
          variant="line"
          items={TABS.map(({ value, label, scope }) => ({
            value,
            label,
            count: counts ? counts[scope] : '–',
          }))}
          value={list.tab.value}
          onValueChange={list.selectTab}
          className="min-w-0 flex-1"
        />
        <BookingsFilter scope={list.tab.scope} filters={valid} onApply={applyFilters} />
      </div>
      <TabPanel
        tabsId={TABS_ID}
        value={list.tab.value}
        className="mt-4 grid items-start gap-5 focus-visible:outline-none lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="flex min-w-0 flex-col gap-3">
          <PagedResults<PatientBooking>
            bare
            list={list}
            found={found}
            resultsRef={results}
            empty={
              <section
                aria-label="Lista de agendamentos"
                className="rounded-card border-border bg-surface shadow-card border"
              >
                {filtered ? (
                  <EmptyState
                    icon={<LuFilterX />}
                    title="Nenhum agendamento com esses filtros"
                    description="Altere ou limpe os filtros para ver outros agendamentos."
                    action={
                      <Button variant="secondary" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<LuCalendarX />}
                    {...list.tab.empty}
                    action={<ButtonLink to={BOOK_URL}>Agendar consulta</ButtonLink>}
                  />
                )}
              </section>
            }
          >
            {(items) => (
              <section
                aria-label="Lista de agendamentos"
                className="rounded-card border-border bg-surface shadow-card overflow-hidden border"
              >
                {groupConsecutive(items, (booking) => formatMonth(booking.startsAt)).map((group) => (
                  <div key={group.key}>
                    <p className={cx(groupHeader, overline, 'not-first:border-t')}>{group.key}</p>
                    <ul className="divide-border divide-y">
                      {group.items.map((booking) => (
                        <li key={booking.id}>
                          <BookingRow
                            booking={booking}
                            selected={desktop && booking.id === selected?.id}
                            onSelect={() => select(booking)}
                            opensDialog={!desktop}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </PagedResults>
        </div>
      </TabPanel>
      <DetailPane
        desktop={desktop}
        label="Detalhes do agendamento"
        open={selected !== undefined}
        paneKey={selected?.id}
        onClose={closeSheet}
      >
        {({ sheet, onClose }) =>
          selected && (
            <BookingDetail
              booking={selected}
              titleId={detailId}
              onCancel={setCancelling}
              {...(sheet && { onClose, tips: true })}
            />
          )
        }
      </DetailPane>
      <CancelDialog booking={cancelling} onClose={() => setCancelling(null)} fallbackFocus={results} />
    </>
  );
}
