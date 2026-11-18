import type { AdminReport } from './reports-api';

type Counts = Pick<
  AdminReport['series'][number],
  'total' | 'pending' | 'confirmed' | 'awaitingRecord' | 'completed' | 'noShow' | 'cancelled' | 'expired'
>;

export interface Outcomes {
  total: number;
  completed: number;
  open: number;
  cancelled: number;
  noShow: number;
}

export const outcomesOf = (counts: Counts): Outcomes => ({
  total: counts.total,
  completed: counts.completed,
  open: counts.pending + counts.confirmed + counts.awaitingRecord,
  cancelled: counts.cancelled + counts.expired,
  noShow: counts.noShow,
});

export function reportOutcomes({ appointments, exams }: AdminReport): Outcomes {
  const a = outcomesOf(appointments);
  const b = outcomesOf(exams);
  return {
    total: a.total + b.total,
    completed: a.completed + b.completed,
    open: a.open + b.open,
    cancelled: a.cancelled + b.cancelled,
    noShow: a.noShow + b.noShow,
  };
}

export const attendanceRate = ({ completed, noShow }: Outcomes) =>
  completed + noShow === 0 ? null : completed / (completed + noShow);

export const cancellationRate = ({ cancelled, total }: Outcomes) => (total === 0 ? null : cancelled / total);
