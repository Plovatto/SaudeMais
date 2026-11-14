import { useQuery } from '@tanstack/react-query';
import { LuBell, LuCalendarCog } from 'react-icons/lu';
import { Link } from 'react-router';
import { PageTitle } from '@components/layout/PageTitle';
import { ButtonLink, Card, IconSlot, QueryError, Skeleton } from '@components/ui';
import { areas } from '@constants/areas';
import { cx } from '@lib/cx';
import { queryKeys } from '@lib/query-keys';
import { doctorApi, type DoctorHome } from './doctor-api';
import { HomeSection } from './HomeSection';

const DOCTOR = areas.doctor.base;
const AGENDA = `${DOCTOR}/agenda`;
const SUMMARY_TITLE_ID = 'doctor-summary-title';

const SUMMARY: readonly { key: keyof DoctorHome['today']; label: string; tone: string }[] = [
  { key: 'pending', label: 'Pendentes', tone: 'text-danger-text' },
  { key: 'total', label: 'Total', tone: 'text-text' },
  { key: 'completed', label: 'Concluídas', tone: 'text-success-text' },
];

const requests = (count: number) =>
  count === 1
    ? 'Um pedido de consulta espera por sua confirmação.'
    : `${count} pedidos de consulta esperam por sua confirmação.`;

function RequestBanner({ count }: { count: number }) {
  return (
    <Link
      to={AGENDA}
      className="rounded-card border-role/30 bg-role-soft shadow-card can-hover:border-role flex items-center gap-3 border p-4 transition-colors"
    >
      <IconSlot className="bg-surface text-role-text size-10 justify-center rounded-full text-xl">
        <LuBell />
      </IconSlot>
      <span className="text-text flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold">Pedido de Consulta!</span>
        <span className="text-sm">{requests(count)}</span>
      </span>
      <span
        aria-hidden
        className="bg-role-strong text-on-role flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
      >
        {count}
      </span>
    </Link>
  );
}

function TodaySummary({ today }: { today: DoctorHome['today'] | undefined }) {
  return (
    <section aria-labelledby={SUMMARY_TITLE_ID}>
      <Card className="flex flex-col gap-4">
        <h2 id={SUMMARY_TITLE_ID} className="text-text text-center text-lg font-semibold">
          Resumo de Hoje
        </h2>
        <dl className="grid grid-cols-3 gap-2 text-center" aria-busy={!today}>
          {SUMMARY.map(({ key, label, tone }) => (
            <div key={key} className="flex flex-col-reverse items-center gap-1">
              <dt className="text-text-secondary text-sm">{label}</dt>
              <dd className={cx('text-2xl font-semibold tabular-nums', tone)}>
                {today ? today[key] : <Skeleton className="h-8 w-10" />}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
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
      {data && data.counts.pending > 0 && <RequestBanner count={data.counts.pending} />}
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr]">
        <TodaySummary today={data?.today} />
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
