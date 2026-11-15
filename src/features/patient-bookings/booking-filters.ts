import { statusDisplay, type StatusKey } from '@components/bookings/booking-display';
import type { PatientBooking } from '@lib/api/models';
import type { BookingListParams } from './bookings-api';

type Scope = BookingListParams['scope'];

export type BookingFilters = { tipo: string; status: string };

export const NO_FILTERS: BookingFilters = { tipo: '', status: '' };

const ALL = { value: '', label: 'Todos' };

const KINDS: Record<string, PatientBooking['kind']> = { consulta: 'appointment', exame: 'exam' };

export const TYPE_OPTIONS = [
  ALL,
  { value: 'consulta', label: 'Consultas' },
  { value: 'exame', label: 'Exames' },
];

const STATUS_SLUGS: Record<StatusKey, string> = {
  pending: 'pendente',
  confirmed: 'confirmado',
  awaiting: 'aguardando-registro',
  completed: 'concluida',
  cancelled: 'cancelada',
  no_show: 'nao-compareceu',
  expired: 'nao-confirmada',
};

const statusOption = (key: StatusKey) => ({
  value: STATUS_SLUGS[key],
  label: statusDisplay(key, 'patient').label,
  status: key === 'awaiting' ? 'confirmed' : key,
});

const STATUSES: Record<Scope, ReturnType<typeof statusOption>[]> = {
  upcoming: (['pending', 'confirmed'] as const).map(statusOption),
  past: (['awaiting', 'completed', 'cancelled', 'no_show', 'expired'] as const).map(statusOption),
};

export const statusOptions = (scope: Scope) => [ALL, ...STATUSES[scope]];

export function normalizeFilters(scope: Scope, { tipo, status }: BookingFilters): BookingFilters {
  return {
    tipo: Object.hasOwn(KINDS, tipo) ? tipo : '',
    status: STATUSES[scope].some((option) => option.value === status) ? status : '',
  };
}

export function filterQuery(scope: Scope, filters: BookingFilters) {
  const { tipo, status } = normalizeFilters(scope, filters);
  return {
    kind: KINDS[tipo],
    status: STATUSES[scope].find((option) => option.value === status)?.status,
  };
}

export const activeCount = ({ tipo, status }: BookingFilters) => Number(tipo !== '') + Number(status !== '');
