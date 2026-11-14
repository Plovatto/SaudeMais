import { useRef, useState } from 'react';
import { LuCalendarCheck, LuCalendarX, LuClock, LuPlus, LuSyringe } from 'react-icons/lu';
import { UPCOMING_EMPTY } from '@components/bookings/booking-display';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import { ButtonLink, EmptyState, TabPanel, Tabs } from '@components/ui';
import { areas } from '@constants/areas';
import { useTabbedList } from '@hooks/useTabbedList';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';
import { queryKeys } from '@lib/query-keys';
import { BookingCard } from './BookingCard';
import { listBookings, type BookingListParams } from './bookings-api';
import { CancelDialog } from './CancelDialog';

const PATIENT = areas.patient.base;
const TABS_ID = 'patient-bookings';

const TABS = [
  {
    value: 'agendados',
    label: 'Agendados',
    scope: 'upcoming',
    icon: <LuCalendarCheck />,
    empty: UPCOMING_EMPTY,
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
  const list = useTabbedList(TABS, ({ scope }, page) => {
    const params: BookingListParams = { scope, page };
    return {
      queryKey: queryKeys.patient.bookings(params),
      queryFn: (signal: AbortSignal) => listBookings(params, signal),
    };
  });
  const [cancelling, setCancelling] = useState<PatientBooking | null>(null);
  const results = useRef<HTMLParagraphElement>(null);
  const counts = list.query.data?.counts;

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
          value={list.tab.value}
          onValueChange={list.selectTab}
          className="lg:max-w-md"
        />
        <TabPanel tabsId={TABS_ID} value={list.tab.value} className="flex flex-col gap-4">
          <PagedResults<PatientBooking>
            list={list}
            found={found}
            resultsRef={results}
            empty={
              <EmptyState
                icon={<LuCalendarX />}
                {...list.tab.empty}
                action={<Shortcuts className="grid-cols-1 sm:grid-cols-2" />}
              />
            }
            footer={<Shortcuts />}
          >
            {(items) => (
              <ul className="grid items-start gap-3 lg:grid-cols-2">
                {items.map((booking) => (
                  <li key={booking.id}>
                    <BookingCard booking={booking} onCancel={setCancelling} />
                  </li>
                ))}
              </ul>
            )}
          </PagedResults>
        </TabPanel>
      </div>
      <CancelDialog booking={cancelling} onClose={() => setCancelling(null)} fallbackFocus={results} />
    </>
  );
}
