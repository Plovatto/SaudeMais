import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LuChartColumn } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import {
  EmptyState,
  MeterList,
  QueryError,
  SectionCard,
  Skeleton,
  StackedColumns,
  type ChartRow,
  type ChartSeries,
} from '@components/ui';
import { ApiError } from '@lib/api/api-error';
import { cx } from '@lib/cx';
import { formatDate } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { BookingSummaries } from './BookingSummaries';
import { PeriodControls } from './PeriodControls';
import { fetchAdminReport, type AdminReport } from './reports-api';
import { usePeriod } from './usePeriod';

type Group = 'completed' | 'open' | 'missed';

const SERIES: readonly ChartSeries<Group>[] = [
  { key: 'completed', label: 'Concluídos', swatch: 'bg-chart-1' },
  { key: 'open', label: 'Em aberto', swatch: 'bg-chart-2' },
  { key: 'missed', label: 'Não realizados', swatch: 'bg-chart-3' },
];

const TOP_LISTS = [
  { key: 'topSpecialties', title: 'Especialidades mais procuradas', empty: 'Nenhuma consulta no período.' },
  { key: 'topExamTypes', title: 'Exames mais procurados', empty: 'Nenhum exame no período.' },
] as const;

const NO_ERRORS = {};

function chartRows({ series, period }: AdminReport): ChartRow<Group>[] {
  const weekly = period.granularity === 'week';
  return series.map((point) => ({
    key: point.start,
    label: weekly ? `Semana de ${formatDate(point.start)}` : formatDate(point.start),
    axisLabel: formatDate(point.start, { year: false }),
    values: {
      completed: point.completed,
      open: point.pending + point.confirmed + point.awaitingRecord,
      missed: point.cancelled + point.noShow + point.expired,
    },
  }));
}

function ReportSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-5 lg:grid-cols-2">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className={cx('h-72', index === 2 && 'lg:col-span-2')} />
      ))}
    </div>
  );
}

function Report({ report }: { report: AdminReport }) {
  const weekly = report.period.granularity === 'week';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <BookingSummaries report={report} />
      <SectionCard
        title={weekly ? 'Agendamentos por semana' : 'Agendamentos por dia'}
        description="Consultas e exames pela situação atual. Não realizados reúne cancelados, faltas e não confirmados."
        className="lg:col-span-2"
      >
        <StackedColumns
          label={weekly ? 'Agendamentos por semana' : 'Agendamentos por dia'}
          rowHeader={weekly ? 'Semana' : 'Dia'}
          series={SERIES}
          rows={chartRows(report)}
        />
      </SectionCard>
      {TOP_LISTS.map(({ key, title, empty }) => {
        const items = report[key];
        return (
          <SectionCard key={key} title={title}>
            {items.length === 0 ? (
              <p className="text-text-secondary text-sm">{empty}</p>
            ) : (
              <MeterList
                label={title}
                max={items[0]?.total ?? 0}
                items={items.map(({ id, name, total }) => ({ key: id, label: name, value: total }))}
              />
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}

export function AdminReportsPage() {
  const { period } = usePeriod();
  const query = useQuery({
    queryKey: queryKeys.adminReport(period),
    queryFn: ({ signal }) => fetchAdminReport(period, signal),
    placeholderData: keepPreviousData,
  });
  const { data, error } = query;
  const fieldErrors =
    error instanceof ApiError && (error.fields['from'] || error.fields['to']) ? error.fields : undefined;
  const empty = data && data.appointments.total + data.exams.total === 0;

  return (
    <>
      <PageHeader
        title="Relatórios"
        {...(data && { subtitle: `${formatDate(data.period.from)} a ${formatDate(data.period.to)}` })}
      />
      <div className="flex flex-col gap-6">
        <PeriodControls errors={fieldErrors ?? NO_ERRORS} />
        {query.isPending && <ReportSkeleton />}
        {query.isError && !fieldErrors && <QueryError error={error} onRetry={() => void query.refetch()} />}
        {empty && (
          <EmptyState
            icon={<LuChartColumn />}
            title="Nenhum agendamento no período"
            description="Escolha outro período para ver os números."
          />
        )}
        {data && !empty && (
          <div
            aria-busy={query.isPlaceholderData}
            className={cx('transition-opacity', query.isPlaceholderData && 'opacity-60')}
          >
            <Report report={data} />
          </div>
        )}
      </div>
    </>
  );
}
