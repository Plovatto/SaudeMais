import { statusDisplay, type StatusKey } from '@components/bookings/booking-display';
import { MeterList, SectionCard, StatGrid, StatusChip } from '@components/ui';
import { formatPercent } from '@lib/number';
import type { AdminReport } from './reports-api';

type Counts = AdminReport['exams'] & { noShowRate?: number | null };

type StatusField =
  'pending' | 'confirmed' | 'awaitingRecord' | 'completed' | 'noShow' | 'cancelled' | 'expired';

const STATUS_KEYS: Record<StatusField, StatusKey> = {
  pending: 'pending',
  confirmed: 'confirmed',
  awaitingRecord: 'awaiting',
  completed: 'completed',
  noShow: 'no_show',
  cancelled: 'cancelled',
  expired: 'expired',
};

const CANCELLED_BY: readonly { key: keyof Counts['cancelledBy']; label: string }[] = [
  { key: 'patient', label: 'Paciente' },
  { key: 'doctor', label: 'Médico' },
  { key: 'admin', label: 'Administrador' },
  { key: 'system', label: 'Sistema' },
];

const KINDS = [
  {
    key: 'appointments',
    title: 'Consultas',
    statuses: ['pending', 'confirmed', 'awaitingRecord', 'completed', 'noShow', 'cancelled', 'expired'],
    labels: {},
  },
  {
    key: 'exams',
    title: 'Exames',
    statuses: ['confirmed', 'awaitingRecord', 'completed', 'cancelled'],
    labels: { awaitingRecord: 'Em andamento' },
  },
] as const satisfies readonly {
  key: 'appointments' | 'exams';
  title: string;
  statuses: readonly StatusField[];
  labels: Partial<Record<StatusField, string>>;
}[];

interface BookingSummaryProps {
  kind: (typeof KINDS)[number];
  counts: Counts;
}

function BookingSummary({ kind, counts }: BookingSummaryProps) {
  const labels: Partial<Record<StatusField, string>> = kind.labels;
  const stats = [
    { label: 'Total', value: counts.total },
    { label: 'Concluídos', value: counts.completed },
    { label: 'Cancelados', value: counts.cancelled },
    ...(counts.noShowRate === undefined
      ? []
      : [
          {
            label: 'Taxa de faltas',
            value: counts.noShowRate === null ? '—' : formatPercent(counts.noShowRate),
          },
        ]),
    { label: 'Cancelamentos tardios', value: counts.lateCancellations },
  ];

  return (
    <SectionCard title={kind.title}>
      <StatGrid stats={stats} className="grid-cols-2 gap-y-5 sm:grid-cols-3" />
      <div className="flex flex-col gap-3">
        <h3 className="text-text text-base font-semibold">Por situação</h3>
        <MeterList
          label={`${kind.title}: por situação`}
          max={counts.total}
          items={kind.statuses.map((field) => {
            const status = statusDisplay(STATUS_KEYS[field], 'admin');
            return {
              key: field,
              value: counts[field],
              label: (
                <StatusChip tone={status.tone} icon={status.icon}>
                  {labels[field] ?? status.label}
                </StatusChip>
              ),
            };
          })}
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-text text-base font-semibold">Cancelamentos por autor</h3>
        <MeterList
          label={`${kind.title}: cancelamentos por autor`}
          max={counts.cancelled}
          items={CANCELLED_BY.map(({ key, label }) => ({ key, label, value: counts.cancelledBy[key] }))}
        />
      </div>
    </SectionCard>
  );
}

export function BookingSummaries({ report }: { report: AdminReport }) {
  return KINDS.map((kind) => <BookingSummary key={kind.key} kind={kind} counts={report[kind.key]} />);
}
