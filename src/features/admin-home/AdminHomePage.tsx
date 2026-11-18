import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LuCalendarDays, LuChartColumn, LuCheck, LuUsers, LuX } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import { countDelta, rateDelta } from '@components/reports/report-deltas';
import {
  attendanceRate,
  cancellationRate,
  outcomesOf,
  reportOutcomes,
  type Outcomes,
} from '@components/reports/report-outcomes';
import {
  DEFAULT_PRESET,
  PERIOD_PRESETS,
  presetPeriod,
  previousPeriod,
  type PeriodPreset,
} from '@components/reports/report-periods';
import { fetchAdminReport, type AdminReport } from '@components/reports/reports-api';
import {
  Card,
  EmptyState,
  MeterList,
  QueryError,
  SectionCard,
  Segmented,
  Skeleton,
  StackedColumns,
  StatTile,
  stagger,
  DeltaBadge,
  type ChartRow,
  type ChartSeries,
} from '@components/ui';
import { useSearchParam } from '@hooks/useSearchParam';
import { cx } from '@lib/cx';
import { formatDate } from '@lib/date';
import { formatCount, formatPercent } from '@lib/number';
import { pluralWord } from '@lib/plural';
import { queryKeys } from '@lib/query-keys';
import { fetchAdminHome } from './admin-home-api';
import { StatusDonut } from './StatusDonut';

const PANEL_PRESETS: readonly PeriodPreset[] = ['7', '30', 'mes', '365'];

const PERIOD_OPTIONS = PERIOD_PRESETS.filter(({ value }) => PANEL_PRESETS.includes(value));

type Group = 'completed' | 'cancelled' | 'noShow';

const SERIES: readonly ChartSeries<Group>[] = [
  { key: 'completed', label: 'Realizados', swatch: 'bg-chart-1' },
  { key: 'cancelled', label: 'Cancelados', swatch: 'bg-chart-2' },
  { key: 'noShow', label: 'Faltas', swatch: 'bg-chart-3' },
];

const TOP_LISTS = [
  { key: 'topSpecialties', title: 'Especialidades mais procuradas', empty: 'Nenhuma consulta no período.' },
  { key: 'topExamTypes', title: 'Exames mais procurados', empty: 'Nenhum exame no período.' },
] as const;

const rate = (value: number | null) => (value === null ? '—' : formatPercent(value));

const isPanelPreset = (value: string): value is PeriodPreset =>
  PANEL_PRESETS.some((preset) => preset === value);

function chartRows({ series, period }: AdminReport): ChartRow<Group>[] {
  const weekly = period.granularity === 'week';
  return series.map((point) => {
    const { completed, cancelled, noShow } = outcomesOf(point);
    return {
      key: point.start,
      label: weekly ? `Semana de ${formatDate(point.start)}` : formatDate(point.start),
      axisLabel: formatDate(point.start, { year: false }),
      values: { completed, cancelled, noShow },
    };
  });
}

function TodayTile() {
  const { data, isError } = useQuery({
    queryKey: queryKeys.adminHome,
    queryFn: ({ signal }) => fetchAdminHome(signal),
  });
  return (
    <StatTile
      label="Consultas hoje"
      icon={<LuCalendarDays />}
      value={isError ? '—' : data && formatCount(data.appointmentsToday)}
      foot={
        isError
          ? 'Não foi possível carregar.'
          : data &&
            `${formatCount(data.patients)} ${pluralWord(data.patients, 'paciente', 'pacientes')} e ${formatCount(data.doctors)} ${pluralWord(data.doctors, 'médico', 'médicos')} ativos`
      }
      className={stagger(3)}
    />
  );
}

interface StatsProps {
  outcomes: Outcomes | undefined;
  previous: Outcomes | undefined;
  report: AdminReport | undefined;
}

function PanelStats({ outcomes, previous, report }: StatsProps) {
  const points = report?.series.map(outcomesOf) ?? [];
  const foot = previous && 'vs. período anterior';
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatTile
        label="Realizados"
        icon={<LuCheck />}
        value={outcomes && formatCount(outcomes.completed)}
        delta={outcomes && countDelta(outcomes.completed, previous?.completed)}
        foot={foot}
        trend={points.map((point) => point.completed)}
        className={stagger(0)}
      />
      <StatTile
        label="Comparecimento"
        icon={<LuUsers />}
        value={outcomes && rate(attendanceRate(outcomes))}
        delta={outcomes && previous && rateDelta(attendanceRate(outcomes), attendanceRate(previous))}
        foot={foot}
        trend={points.map((point) => attendanceRate(point) ?? 0)}
        className={stagger(1)}
      />
      <StatTile
        label="Cancelamentos"
        icon={<LuX />}
        value={outcomes && rate(cancellationRate(outcomes))}
        delta={
          outcomes &&
          previous &&
          rateDelta(cancellationRate(outcomes), cancellationRate(previous), { higherIsBetter: false })
        }
        foot={foot}
        trend={points.map((point) => cancellationRate(point) ?? 0)}
        className={stagger(2)}
      />
      <TodayTile />
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      <Skeleton className="h-80 lg:col-span-8" />
      <Skeleton className="h-80 lg:col-span-4" />
      <Skeleton className="h-56 lg:col-span-6" />
      <Skeleton className="h-56 lg:col-span-6" />
    </div>
  );
}

function PanelCharts({
  report,
  outcomes,
  previous,
}: {
  report: AdminReport;
  outcomes: Outcomes;
  previous?: Outcomes | undefined;
}) {
  const weekly = report.period.granularity === 'week';
  const delta = countDelta(outcomes.total, previous?.total);
  const average = outcomes.total / Math.max(report.series.length, 1);
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      <SectionCard
        title="Volume de agendamentos"
        description="Consultas e exames marcados no período, pela situação atual."
        className={cx('lg:col-span-8', stagger(1))}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="text-text text-[1.875rem]/[1.1] font-[650] tracking-[-0.02em] tabular-nums">
              {formatCount(outcomes.total)}
            </span>
            {delta && <DeltaBadge delta={delta} />}
          </div>
          <p className="text-text-secondary text-[0.8125rem]">
            média de <b className="text-text tabular-nums">{formatCount(Math.round(average))}</b> por{' '}
            {weekly ? 'semana' : 'dia'}
          </p>
        </div>
        <StackedColumns
          label={weekly ? 'Agendamentos por semana' : 'Agendamentos por dia'}
          rowHeader={weekly ? 'Semana' : 'Dia'}
          series={SERIES}
          rows={chartRows(report)}
        />
      </SectionCard>
      <SectionCard
        title="Situação dos agendamentos"
        description="Cancelados inclui os pedidos não confirmados a tempo."
        className={cx('lg:col-span-4', stagger(2))}
      >
        <StatusDonut
          total={outcomes.total}
          center="realizados"
          parts={[
            {
              key: 'completed',
              label: 'Realizados',
              value: outcomes.completed,
              swatch: 'bg-chart-1',
              stroke: 'var(--chart-1)',
            },
            {
              key: 'cancelled',
              label: 'Cancelados',
              value: outcomes.cancelled,
              swatch: 'bg-chart-2',
              stroke: 'var(--chart-2)',
            },
            {
              key: 'noShow',
              label: 'Faltas',
              value: outcomes.noShow,
              swatch: 'bg-chart-3',
              stroke: 'var(--chart-3)',
            },
            { key: 'open', label: 'Em aberto', value: outcomes.open, swatch: 'bg-surface-strong' },
          ]}
        />
      </SectionCard>
      {TOP_LISTS.map(({ key, title, empty }, index) => {
        const items = report[key];
        return (
          <SectionCard key={key} title={title} className={cx('lg:col-span-6', stagger(3 + index))}>
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

export function AdminHomePage() {
  const [presetParam, setPreset] = useSearchParam('periodo', DEFAULT_PRESET);
  const preset = isPanelPreset(presetParam) ? presetParam : DEFAULT_PRESET;
  const period = presetPeriod(preset);
  const before = previousPeriod(period);
  const current = useQuery({
    queryKey: queryKeys.adminReport(period),
    queryFn: ({ signal }) => fetchAdminReport(period, signal),
    placeholderData: keepPreviousData,
  });
  const past = useQuery({
    queryKey: queryKeys.adminReport(before),
    queryFn: ({ signal }) => fetchAdminReport(before, signal),
  });
  const report = current.isPlaceholderData ? undefined : current.data;
  const outcomes = report && reportOutcomes(report);
  const previous = past.data && reportOutcomes(past.data);

  return (
    <>
      <PageHeader
        title="Painel"
        subtitle={`Visão geral da clínica · ${formatDate(period.from)} a ${formatDate(period.to)}`}
        action={
          <Segmented
            label="Período"
            options={PERIOD_OPTIONS}
            value={preset}
            onValueChange={(value) => setPreset(value, { replace: true })}
          />
        }
      />
      {current.isError ? (
        <Card>
          <QueryError error={current.error} onRetry={() => void current.refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-4 lg:gap-5">
          <PanelStats outcomes={outcomes} previous={previous} report={report} />
          {!report || !outcomes ? (
            <PanelSkeleton />
          ) : outcomes.total === 0 ? (
            <Card className="motion-safe:animate-rise">
              <EmptyState
                icon={<LuChartColumn />}
                title="Nenhum agendamento no período"
                description="Escolha outro período para ver os números."
              />
            </Card>
          ) : (
            <PanelCharts report={report} outcomes={outcomes} previous={previous} />
          )}
        </div>
      )}
    </>
  );
}
