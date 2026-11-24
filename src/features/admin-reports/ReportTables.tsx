import { statusDisplay, type StatusKey } from '@components/bookings/booking-display';
import { seriesCopy, TOP_LISTS } from '@components/reports/report-copy';
import { outcomesOf } from '@components/reports/report-outcomes';
import type { AdminReport } from '@components/reports/reports-api';
import { SectionCard, StatusChip } from '@components/ui';
import { formatDate } from '@lib/date';
import { formatCount } from '@lib/number';
import { plural } from '@lib/plural';
import { ReportTable } from './ReportTable';

type Kind = AdminReport['appointments'];

type StatusField =
  'pending' | 'confirmed' | 'awaitingRecord' | 'completed' | 'noShow' | 'cancelled' | 'expired';

const STATUSES: readonly { field: StatusField; status: StatusKey; exams: boolean }[] = [
  { field: 'pending', status: 'pending', exams: false },
  { field: 'confirmed', status: 'confirmed', exams: true },
  { field: 'awaitingRecord', status: 'awaiting', exams: true },
  { field: 'completed', status: 'completed', exams: true },
  { field: 'noShow', status: 'no_show', exams: false },
  { field: 'cancelled', status: 'cancelled', exams: true },
  { field: 'expired', status: 'expired', exams: false },
];

const CANCELLED_BY: readonly { key: keyof Kind['cancelledBy']; label: string }[] = [
  { key: 'patient', label: 'Paciente' },
  { key: 'doctor', label: 'Médico' },
  { key: 'admin', label: 'Administrador' },
  { key: 'system', label: 'Sistema' },
];

const KIND_COLUMNS = ['Consultas', 'Exames'];

const SERIES_COLUMNS = ['Total', 'Realizados', 'Em aberto', 'Cancelados', 'Faltas'];

const counts = (values: readonly number[]) => values.map(formatCount);

function SeriesTable({ report }: { report: AdminReport }) {
  const { title, rowHeader, rowLabel } = seriesCopy(report.period.granularity);
  const values = (point: Parameters<typeof outcomesOf>[0]) => {
    const { total, completed, open, cancelled, noShow } = outcomesOf(point);
    return [total, completed, open, cancelled, noShow];
  };
  const totals = report.series
    .map(values)
    .reduce((sum, row) => sum.map((value, index) => value + (row[index] ?? 0)), [0, 0, 0, 0, 0]);
  return (
    <SectionCard
      flush
      title={title}
      description="Consultas e exames pela situação atual. Cancelados inclui os não confirmados a tempo."
      action={
        <span className="text-text-muted text-xs tabular-nums">
          {formatDate(report.period.from)} a {formatDate(report.period.to)}
        </span>
      }
      className="lg:col-span-2"
    >
      <ReportTable
        label={title}
        rowHeader={rowHeader}
        columns={SERIES_COLUMNS}
        rows={report.series.map((point) => ({
          key: point.start,
          header: rowLabel(point.start),
          cells: counts(values(point)),
        }))}
        total={counts(totals)}
      />
    </SectionCard>
  );
}

function StatusTable({ report }: { report: AdminReport }) {
  return (
    <SectionCard flush title="Por situação">
      <ReportTable
        label="Agendamentos por situação"
        rowHeader="Situação"
        columns={KIND_COLUMNS}
        rows={STATUSES.map(({ field, status, exams }) => {
          const display = statusDisplay(status, 'admin');
          return {
            key: field,
            header: (
              <StatusChip tone={display.tone} icon={display.icon}>
                {display.label}
              </StatusChip>
            ),
            cells: [formatCount(report.appointments[field]), exams ? formatCount(report.exams[field]) : '—'],
          };
        })}
        total={counts([report.appointments.total, report.exams.total])}
      />
    </SectionCard>
  );
}

function CancelledByTable({ report }: { report: AdminReport }) {
  const { appointments, exams } = report;
  return (
    <SectionCard flush title="Cancelamentos por autor">
      <ReportTable
        label="Cancelamentos por autor"
        rowHeader="Autor"
        columns={KIND_COLUMNS}
        rows={[
          ...CANCELLED_BY.map(({ key, label }) => ({
            key,
            header: label,
            cells: counts([appointments.cancelledBy[key], exams.cancelledBy[key]]),
          })),
          { key: 'expired', header: 'Não confirmada', cells: [formatCount(appointments.expired), '—'] },
        ]}
        total={counts([outcomesOf(appointments).cancelled, outcomesOf(exams).cancelled])}
      />
      <p className="text-text-muted px-4 py-3 text-[0.8125rem] lg:px-5">
        {`Cancelamentos tardios: ${plural(appointments.lateCancellations, 'consulta', 'consultas')} e ${plural(exams.lateCancellations, 'exame', 'exames')}.`}
      </p>
    </SectionCard>
  );
}

export function ReportTables({ report }: { report: AdminReport }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <SeriesTable report={report} />
      <StatusTable report={report} />
      <CancelledByTable report={report} />
      {TOP_LISTS.map(({ key, title, rowHeader, empty }) => {
        const items = report[key];
        return (
          <SectionCard key={key} flush={items.length > 0} title={title}>
            {items.length === 0 ? (
              <p className="text-text-secondary text-sm">{empty}</p>
            ) : (
              <ReportTable
                label={title}
                rowHeader={rowHeader}
                columns={['Agendamentos']}
                rows={items.map(({ id, name, total }) => ({
                  key: id,
                  header: name,
                  cells: [formatCount(total)],
                }))}
              />
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
