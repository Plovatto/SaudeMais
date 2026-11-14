import { useQuery } from '@tanstack/react-query';
import { LuSettings, LuTrendingUp, LuUserCog } from 'react-icons/lu';
import { PageTitle } from '@components/layout/PageTitle';
import { ButtonLink, Card, IconSlot, QueryError, Skeleton } from '@components/ui';
import { areas } from '@constants/areas';
import { queryKeys } from '@lib/query-keys';
import { fetchAdminHome, type AdminHome } from './admin-home-api';

const SUMMARY_TITLE_ID = 'admin-summary-title';
const ADMIN = areas.admin.base;

const COUNTS: readonly { key: keyof AdminHome; label: string }[] = [
  { key: 'patients', label: 'Pacientes' },
  { key: 'appointmentsToday', label: 'Consultas Hoje' },
  { key: 'doctors', label: 'Médicos' },
];

const counter = new Intl.NumberFormat('pt-BR');

function SummaryCounts({ data }: { data: AdminHome | undefined }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center" aria-busy={!data}>
      {COUNTS.map(({ key, label }) => (
        <div key={key} className="flex flex-col-reverse items-center gap-1">
          <dt className="text-text-secondary text-sm">{label}</dt>
          <dd className="text-text text-2xl font-semibold tabular-nums lg:text-3xl">
            {data ? counter.format(data[key]) : <Skeleton className="h-8 w-12" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminHomePage() {
  const { data, error, isError, refetch } = useQuery({
    queryKey: queryKeys.adminHome,
    queryFn: ({ signal }) => fetchAdminHome(signal),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col items-center gap-2 pt-4 text-center">
        <IconSlot badge="strong" className="mb-2">
          <LuSettings />
        </IconSlot>
        <PageTitle className="text-2xl">Painel Admin</PageTitle>
        <p className="text-text-secondary">Gerenciamento do Sistema</p>
      </header>

      <section aria-labelledby={SUMMARY_TITLE_ID} className="flex flex-col gap-4">
        <h2 id={SUMMARY_TITLE_ID} className="text-text text-center text-lg font-semibold">
          Resumo do Sistema
        </h2>
        <Card className="lg:px-10 lg:py-8">
          {isError ? (
            <QueryError error={error} onRetry={() => void refetch()} />
          ) : (
            <SummaryCounts data={data} />
          )}
        </Card>
      </section>

      <nav aria-label="Atalhos do painel" className="grid grid-cols-2 gap-3">
        <ButtonLink to={`${ADMIN}/usuarios`} size="lg" className="col-span-2">
          <LuUserCog aria-hidden />
          Gerenciar Usuários
        </ButtonLink>
        <ButtonLink to={`${ADMIN}/relatorios`} variant="secondary">
          <LuTrendingUp aria-hidden />
          Relatórios
        </ButtonLink>
        <ButtonLink to={`${ADMIN}/configuracoes`} variant="secondary">
          <LuSettings aria-hidden />
          Configurações
        </ButtonLink>
      </nav>
    </div>
  );
}
