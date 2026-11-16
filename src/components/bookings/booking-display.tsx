import type { ReactNode } from 'react';
import {
  LuCalendarClock,
  LuCalendarX,
  LuCircleCheck,
  LuCircleCheckBig,
  LuCircleX,
  LuHourglass,
  LuUserX,
} from 'react-icons/lu';
import type { StatusChipProps } from '@components/ui';
import type { Role } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';

export interface StatusDisplay {
  label: string;
  tone: StatusChipProps['tone'];
  icon: ReactNode;
}

type BookingStatus = PatientBooking['status'];

export type StatusKey = BookingStatus | 'awaiting';

const statuses: Record<Exclude<StatusKey, 'pending'>, StatusDisplay> = {
  confirmed: { label: 'Confirmado', tone: 'success', icon: <LuCircleCheck /> },
  awaiting: { label: 'Aguardando registro', tone: 'info', icon: <LuCalendarClock /> },
  completed: { label: 'Concluída', tone: 'info', icon: <LuCircleCheckBig /> },
  cancelled: { label: 'Cancelada', tone: 'danger', icon: <LuCircleX /> },
  no_show: { label: 'Não compareceu', tone: 'neutral', icon: <LuUserX /> },
  expired: { label: 'Não confirmada', tone: 'neutral', icon: <LuCalendarX /> },
};

export function statusDisplay(key: StatusKey, viewer: Role): StatusDisplay {
  if (key !== 'pending') return statuses[key];
  return { label: viewer === 'doctor' ? 'A confirmar' : 'Pendente', tone: 'warning', icon: <LuHourglass /> };
}

export const hasStarted = (startsAt: string, now = Date.now()) => new Date(startsAt).getTime() <= now;

export function bookingStatus(
  { status, startsAt }: { status: BookingStatus; startsAt: string },
  viewer: Role,
  now = Date.now(),
): StatusDisplay {
  return statusDisplay(status === 'confirmed' && hasStarted(startsAt, now) ? 'awaiting' : status, viewer);
}

export function bookingTitle({ kind, doctor, specialty, examType, unit }: PatientBooking) {
  return kind === 'exam'
    ? { title: unit.name, subtitle: `Exame · ${examType?.name ?? ''}` }
    : { title: doctor?.fullName ?? '', subtitle: specialty?.name ?? '' };
}

export const UPCOMING_EMPTY = {
  title: 'Nenhum agendamento futuro',
  description: 'Agende uma consulta ou um exame para acompanhar por aqui.',
};
