import type { AdminReport } from '@components/reports/reports-api';

export const reportCounts = {
  total: 40,
  pending: 3,
  confirmed: 8,
  awaitingRecord: 2,
  completed: 18,
  noShow: 2,
  cancelled: 6,
  expired: 1,
  lateCancellations: 2,
  cancelledBy: { patient: 4, doctor: 1, admin: 0, system: 1 },
};

const point = (start: string, completed: number) => ({
  start,
  total: completed + 4,
  pending: 1,
  confirmed: 1,
  awaitingRecord: 0,
  completed,
  noShow: 1,
  cancelled: 1,
  expired: 0,
});

export function adminReport(overrides: Partial<AdminReport> = {}): AdminReport {
  return {
    period: { from: '2026-10-17', to: '2026-11-15', granularity: 'day' },
    appointments: { ...reportCounts, noShowRate: 0.1 },
    exams: {
      ...reportCounts,
      total: 12,
      pending: 0,
      noShow: 0,
      expired: 0,
      completed: 7,
      lateCancellations: 1,
      cancelledBy: { patient: 2, doctor: 0, admin: 1, system: 0 },
    },
    series: [point('2026-11-14', 3), point('2026-11-15', 5)],
    topSpecialties: [
      { id: 's1', name: 'Cardiologia', total: 12 },
      { id: 's2', name: 'Dermatologia', total: 7 },
    ],
    topExamTypes: [{ id: 'e1', name: 'Hemograma', total: 9 }],
    ...overrides,
  };
}

export const emptyReport = () => {
  const empty = { ...reportCounts, total: 0, completed: 0, cancelled: 0 };
  return adminReport({
    appointments: { ...empty, noShowRate: null },
    exams: empty,
    topSpecialties: [],
    topExamTypes: [],
  });
};
