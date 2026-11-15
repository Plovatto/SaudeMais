import { useRef } from 'react';
import { LuCalendarCog, LuCalendarX } from 'react-icons/lu';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import { ButtonLink, EmptyState, TabPanel, Tabs } from '@components/ui';
import { areas } from '@constants/areas';
import { AGENDA_TABS } from '@constants/doctor-agenda';
import { useTabbedList } from '@hooks/useTabbedList';
import type { DoctorAppointment } from '@lib/api/models';
import { queryKeys } from '@lib/query-keys';
import { AppointmentList } from './AppointmentList';
import { doctorApi, type AgendaParams } from './doctor-api';

const DOCTOR = areas.doctor.base;
const TABS_ID = 'doctor-agenda';

const TABS = [
  {
    value: AGENDA_TABS.pending,
    label: 'A confirmar',
    tab: 'pending',
    empty: { title: 'Nenhum pedido a confirmar', description: 'Novos pedidos de consulta aparecem aqui.' },
  },
  {
    value: AGENDA_TABS.confirmed,
    label: 'Confirmadas',
    tab: 'confirmed',
    empty: {
      title: 'Nenhuma consulta confirmada',
      description: 'As próximas consultas que você confirmar aparecem aqui.',
    },
  },
  {
    value: AGENDA_TABS.awaiting,
    label: 'Aguardando registro',
    tab: 'awaiting',
    empty: {
      title: 'Nenhuma consulta aguardando registro',
      description: 'Consultas confirmadas que já começaram aparecem aqui.',
    },
  },
  {
    value: AGENDA_TABS.history,
    label: 'Histórico',
    tab: 'history',
    empty: {
      title: 'Nenhuma consulta no histórico',
      description: 'Consultas concluídas, faltas, cancelamentos e pedidos não confirmados aparecem aqui.',
    },
  },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const found = (total: number) => (total === 1 ? '1 consulta' : `${total} consultas`);

export function DoctorAgendaPage() {
  const list = useTabbedList(TABS, ({ tab }, page) => {
    const params: AgendaParams = { tab, page };
    return {
      queryKey: queryKeys.doctor.appointments(params),
      queryFn: (signal: AbortSignal) => doctorApi.list(params, signal),
    };
  });
  const results = useRef<HTMLParagraphElement>(null);
  const counts = list.lastData?.counts;

  return (
    <>
      <PageHeader title="Consultas Agendadas" back backFallback={DOCTOR} />
      <div className="flex flex-col gap-5">
        <ButtonLink to={`${DOCTOR}/disponibilidade`} size="lg" className="rounded-card lg:max-w-md">
          <LuCalendarCog aria-hidden />
          Gerenciar Minha Agenda
        </ButtonLink>
        <Tabs<TabValue>
          id={TABS_ID}
          label="Agenda"
          items={TABS.map(({ value, label, tab }) => ({
            value,
            label: `${label} (${counts ? counts[tab] : '–'})`,
          }))}
          value={list.tab.value}
          onValueChange={list.selectTab}
          className="grid grid-cols-2 lg:grid-cols-4"
        />
        <TabPanel tabsId={TABS_ID} value={list.tab.value} className="flex flex-col gap-4">
          <PagedResults<DoctorAppointment>
            list={list}
            found={found}
            resultsRef={results}
            empty={<EmptyState icon={<LuCalendarX />} {...list.tab.empty} />}
          >
            {(items) => <AppointmentList items={items} grouped fallbackFocus={results} />}
          </PagedResults>
        </TabPanel>
      </div>
    </>
  );
}
