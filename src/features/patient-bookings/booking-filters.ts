import { statusDisplay, type StatusKey } from '@components/bookings/booking-display';
import type { PatientBooking } from '@lib/api/models';
import type { BookingListParams } from './bookings-api';

type Scope = BookingListParams['scope'];

export interface BookingFilters {
  tipo: string;
  status: string;
}

export const NO_FILTERS: BookingFilters = { tipo: '', status: '' };

const ALL = { value: '', label: 'Todos' };

const KINDS: Record<string, PatientBooking['kind']> = { consulta: 'appointment', exame: 'exam' };

export const TYPE_OPTIONS = [
  ALL,
  { value: 'consulta', label: 'Consultas' },
  { value: 'exame', label: 'Exames' },
];

const SCOPE_STATUSES: Record<Scope, StatusKey[]> = {
  upcoming: ['pending', 'confirmed'],
  past: ['awaiting', 'completed', 'cancelled', 'no_show', 'expired'],
};

const slug = (label: string) =>
  label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(' ', '-');

const statusesOf = (scope: Scope) =>
  SCOPE_STATUSES[scope].map((key) => {
    const { label } = statusDisplay(key, 'patient');
    return { value: slug(label), label, status: key === 'awaiting' ? 'confirmed' : key };
  });

export const statusOptions = (scope: Scope) => [ALL, ...statusesOf(scope)];

export function normalizeFilters(scope: Scope, { tipo, status }: BookingFilters): BookingFilters {
  return {
    tipo: Object.hasOwn(KINDS, tipo) ? tipo : '',
    status: statusesOf(scope).some((option) => option.value === status) ? status : '',
  };
}

export function filterQuery(scope: Scope, filters: BookingFilters) {
  const { tipo, status } = normalizeFilters(scope, filters);
  return {
    kind: KINDS[tipo],
    status: statusesOf(scope).find((option) => option.value === status)?.status,
  };
}

export const activeCount = ({ tipo, status }: BookingFilters) => Number(tipo !== '') + Number(status !== '');
