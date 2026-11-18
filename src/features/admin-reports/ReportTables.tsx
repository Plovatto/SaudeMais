import { statusDisplay, type StatusKey } from '@components/bookings/booking-display';
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

const TOP_LISTS = [
  {
    key: 'topSpecialties',
    title: 'Especialidades mais procuradas',
    rowHeader: 'Especialidade',
    empty: 'Nenhuma consulta no período.',
  },
  {
    key: 'topExamTypes',
    title: 'Exames mais procurados',
    rowHeader: 'Exame',
    empty: 'Nenhum exame no período.',
  },
] as const;

const counts = (values: readonly number[]) => values.map(formatCount);

function SeriesTable({ report }: { report: AdminReport }) {
  const weekly = report.period.granularity === 'week';
  const title = weekly ? 'Agendamentos por semana' : 'Agendamentos por dia';
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
        rowHeader={weekly ? 'Semana' : 'Dia'}
        columns={SERIES_COLUMNS}
        rows={report.series.map((point) => ({
          key: point.start,
          header: weekly ? `Semana de ${formatDate(point.start)}` : formatDate(point.start),
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
    <SectionCard
      flush
      title="Cancelamentos por autor"
      description={`Cancelamentos tardios: ${plural(appointments.lateCancellations, 'consulta', 'consultas')} e ${plural(exams.lateCancellations, 'exame', 'exames')}.`}
    >
      <ReportTable
        label="Cancelamentos por autor"
        rowHeader="Autor"
        columns={KIND_COLUMNS}
        rows={CANCELLED_BY.map(({ key, label }) => ({
          key,
          header: label,
          cells: counts([appointments.cancelledBy[key], exams.cancelledBy[key]]),
        }))}
        total={counts([appointments.cancelled, exams.cancelled])}
      />
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
