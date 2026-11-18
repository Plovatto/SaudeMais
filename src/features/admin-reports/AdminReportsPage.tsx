import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { LuDownload, LuFileText } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import { NoBookings } from '@components/reports/NoBookings';
import { attendanceRate, reportOutcomes } from '@components/reports/report-outcomes';
import {
  downloadAdminReport,
  fetchAdminReport,
  type AdminReport,
  type ReportFormat,
} from '@components/reports/reports-api';
import { Button, Card, QueryError, Skeleton, StatTile, stagger, useToast } from '@components/ui';
import { useLeaveSignal } from '@hooks/useLeaveSignal';
import { ApiError } from '@lib/api/api-error';
import { cx } from '@lib/cx';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { formatCount, formatPercent } from '@lib/number';
import { queryKeys } from '@lib/query-keys';
import { saveFile } from '@lib/save-file';
import { PeriodControls } from './PeriodControls';
import { ReportTables } from './ReportTables';
import { usePeriod } from './usePeriod';

const NO_ERRORS = {};

const EXPORTS: readonly { format: ReportFormat; label: string; icon: ReactNode; primary: boolean }[] = [
  { format: 'xlsx', label: 'Excel', icon: <LuDownload />, primary: false },
  { format: 'pdf', label: 'PDF', icon: <LuFileText />, primary: true },
];

const TILE_GRID = 'grid grid-cols-2 gap-3 min-[1281px]:grid-cols-5 sm:grid-cols-3 lg:gap-4';

const LAST_TILE = 'max-sm:col-span-2';

function SummaryTiles({ report }: { report: AdminReport }) {
  const outcomes = reportOutcomes(report);
  const attendance = attendanceRate(outcomes);
  const tiles = [
    { label: 'Agendamentos', value: formatCount(outcomes.total) },
    { label: 'Realizados', value: formatCount(outcomes.completed) },
    { label: 'Cancelados', value: formatCount(outcomes.cancelled) },
    { label: 'Faltas', value: formatCount(outcomes.noShow) },
    { label: 'Comparecimento', value: attendance === null ? '—' : formatPercent(attendance) },
  ];
  return (
    <div className={TILE_GRID}>
      {tiles.map(({ label, value }, index) => (
        <StatTile
          key={label}
          compact
          label={label}
          value={value}
          className={cx(stagger(index), index === tiles.length - 1 && LAST_TILE)}
        />
      ))}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 lg:gap-5">
      <div className={TILE_GRID}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className={cx('h-[88px]', index === 4 && LAST_TILE)} />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function AdminReportsPage() {
  const { period } = usePeriod();
  const { show } = useToast();
  const leaving = useLeaveSignal();
  const query = useQuery({
    queryKey: queryKeys.adminReport(period),
    queryFn: ({ signal }) => fetchAdminReport(period, signal),
    placeholderData: keepPreviousData,
  });
  const { data, error } = query;
  const fieldErrors =
    error instanceof ApiError && (error.fields['from'] || error.fields['to']) ? error.fields : undefined;
  const empty = data && data.appointments.total + data.exams.total === 0;
  const ready = data !== undefined && !query.isPlaceholderData && !query.isError;
  const exporting = useMutation({
    mutationFn: ({ format, report }: { format: ReportFormat; report: AdminReport }) =>
      downloadAdminReport(report.period, format, leaving.current.signal),
    onSuccess: (file, { format, report }) =>
      saveFile(file, `relatorio_${report.period.from}_a_${report.period.to}.${format}`),
    onError: (exportError) => {
      if (!leaving.current.signal.aborted) show({ tone: 'danger', message: errorMessage(exportError) });
    },
  });

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Escolha o período, confira na tela e exporte."
        action={EXPORTS.map(({ format, label, icon, primary }) => {
          const busy = exporting.isPending && exporting.variables.format === format;
          return (
            <Button
              key={format}
              variant={primary ? 'primary' : 'secondary'}
              icon={icon}
              loading={busy}
              disabled={!ready || (exporting.isPending && !busy)}
              loadingLabel={label}
              onClick={() => data && exporting.mutate({ format, report: data })}
            >
              {busy ? 'Gerando…' : label}
            </Button>
          );
        })}
      />
      <div className="flex flex-col gap-4 lg:gap-5">
        <PeriodControls errors={fieldErrors ?? NO_ERRORS} />
        {query.isPending && <ReportSkeleton />}
        {query.isError && !fieldErrors && (
          <Card>
            <QueryError error={error} onRetry={() => void query.refetch()} />
          </Card>
        )}
        {data && (
          <div
            aria-busy={query.isPlaceholderData}
            className={cx(
              'flex flex-col gap-4 transition-opacity lg:gap-5',
              query.isPlaceholderData && 'opacity-60',
            )}
          >
            {empty ? (
              <NoBookings />
            ) : (
              <>
                <SummaryTiles report={data} />
                <ReportTables report={data} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
