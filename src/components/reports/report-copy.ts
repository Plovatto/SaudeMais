import { formatDate } from '@lib/date';
import type { AdminReport } from './reports-api';

export const TOP_LISTS = [
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

export function seriesCopy(granularity: AdminReport['period']['granularity']) {
  const weekly = granularity === 'week';
  return {
    weekly,
    title: weekly ? 'Agendamentos por semana' : 'Agendamentos por dia',
    rowHeader: weekly ? 'Semana' : 'Dia',
    unit: weekly ? 'semana' : 'dia',
    rowLabel: (start: string) => (weekly ? `Semana de ${formatDate(start)}` : formatDate(start)),
  };
}
