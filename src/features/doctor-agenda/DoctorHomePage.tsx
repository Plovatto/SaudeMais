import { useQuery } from '@tanstack/react-query';
import { LuCalendarCog } from 'react-icons/lu';
import { PageTitle } from '@components/layout/PageTitle';
import { LastNotification } from '@components/notifications/LastNotification';
import { NoticeLink } from '@components/notifications/NoticeLink';
import { ButtonLink, QueryError, SectionCard, StatGrid } from '@components/ui';
import { areas } from '@constants/areas';
import { notificationText } from '@lib/messages/notifications.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { doctorApi, type DoctorHome } from './doctor-api';
import { HomeSection } from './HomeSection';

const DOCTOR = areas.doctor.base;
const AGENDA = `${DOCTOR}/agenda`;

const SUMMARY: readonly { key: Exclude<keyof DoctorHome['today'], 'date'>; label: string; tone: string }[] = [
  { key: 'pending', label: 'Pendentes', tone: 'text-danger-text' },
  { key: 'total', label: 'Total', tone: 'text-text' },
  { key: 'completed', label: 'Concluídas', tone: 'text-success-text' },
];

const requests = (count: number) =>
  count === 1
    ? 'Um pedido de consulta espera por sua confirmação.'
    : `${count} pedidos de consulta esperam por sua confirmação.`;

const REQUEST_TITLE = notificationText({ type: 'appointment_requested', params: {} }).title;

function RequestBanner({ count }: { count: number }) {
  return (
    <NoticeLink
      label="Pedidos de consulta"
      to={`${AGENDA}?aba=a-confirmar`}
      title={REQUEST_TITLE}
      body={requests(count)}
      marker={
        <span
          aria-hidden
          className="bg-role-strong text-on-role flex size-7 shrink-0 items-center justify-center self-center rounded-full text-sm font-bold tabular-nums"
        >
          {count}
        </span>
      }
    />
  );
}

export function DoctorHomePage() {
  const query = useQuery({
    queryKey: queryKeys.doctor.home,
    queryFn: ({ signal }) => doctorApi.home(signal),
  });
  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle className="sr-only">Início</PageTitle>
      {query.isError && <QueryError error={query.error} onRetry={() => void query.refetch()} />}
      {data?.lastNotification ? (
        <LastNotification
          notification={data.lastNotification}
          role="doctor"
          homeKey={queryKeys.doctor.home}
        />
      ) : (
        data && data.counts.pending > 0 && <RequestBanner count={data.counts.pending} />
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr]">
        <SectionCard title="Resumo de Hoje">
          <StatGrid
            stats={SUMMARY.map(({ key, label, tone }) => ({ label, tone, value: data?.today[key] }))}
          />
        </SectionCard>
        <ButtonLink to={`${DOCTOR}/disponibilidade`} size="lg" className="rounded-card">
          <LuCalendarCog aria-hidden />
          Gerenciar Minha Agenda
        </ButtonLink>
        {!query.isError && (
          <>
            <HomeSection
              title="Consultas Pendentes"
              total={data?.counts.pending}
              items={data?.pending}
              empty="Nenhum pedido a confirmar"
              link={{ to: AGENDA, label: 'Ver Agenda Completa' }}
              className="lg:col-start-2 lg:row-span-3 lg:row-start-1"
            />
            <HomeSection
              title="Aguardando registro"
              total={data?.counts.awaiting}
              items={data?.awaitingRecord}
              empty="Nenhuma consulta aguardando registro"
              link={{ to: `${AGENDA}?aba=aguardando-registro`, label: 'Ver todas aguardando registro' }}
            />
          </>
        )}
      </div>
    </div>
  );
}
