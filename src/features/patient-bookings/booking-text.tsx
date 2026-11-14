import type { ReactNode } from 'react';
import {
  LuCalendarX,
  LuCircleCheck,
  LuCircleCheckBig,
  LuCircleX,
  LuCalendarClock,
  LuHourglass,
  LuUserX,
} from 'react-icons/lu';
import type { StatusChipProps } from '@components/ui';
import { formatDateTime } from '@lib/date';
import type { PatientBooking } from './bookings-api';

interface StatusDisplay {
  label: string;
  tone: StatusChipProps['tone'];
  icon: ReactNode;
}

const statuses: Record<PatientBooking['status'] | 'awaiting', StatusDisplay> = {
  pending: { label: 'Pendente', tone: 'warning', icon: <LuHourglass /> },
  confirmed: { label: 'Confirmado', tone: 'success', icon: <LuCircleCheck /> },
  awaiting: { label: 'Aguardando registro', tone: 'info', icon: <LuCalendarClock /> },
  completed: { label: 'Concluída', tone: 'info', icon: <LuCircleCheckBig /> },
  cancelled: { label: 'Cancelada', tone: 'danger', icon: <LuCircleX /> },
  no_show: { label: 'Não compareceu', tone: 'neutral', icon: <LuUserX /> },
  expired: { label: 'Não confirmada', tone: 'neutral', icon: <LuCalendarX /> },
};

export function bookingStatus({ status, startsAt }: PatientBooking, now = Date.now()): StatusDisplay {
  const started = new Date(startsAt).getTime() <= now;
  return statuses[status === 'confirmed' && started ? 'awaiting' : status];
}

export const cancelledBy: Record<NonNullable<PatientBooking['cancellation']>['byRole'], string> = {
  patient: 'Cancelada por você',
  doctor: 'Cancelada pelo médico',
  admin: 'Cancelada pela administração',
  system: 'Cancelada pelo sistema',
};

export const blockedNotes: Partial<
  Record<NonNullable<PatientBooking['actions']['cancelBlockedReason']>, string>
> = {
  started: 'Este agendamento já começou e não pode mais ser cancelado.',
  unavailable: 'Para cancelar este exame, ligue para a unidade.',
};

export function bookingTitle({ kind, doctor, specialty, examType, unit }: PatientBooking) {
  return kind === 'exam'
    ? { title: unit.name, subtitle: `Exame · ${examType?.name ?? ''}` }
    : { title: doctor?.fullName ?? '', subtitle: specialty?.name ?? '' };
}

export function bookingSummary(booking: PatientBooking): string {
  const when = formatDateTime(booking.startsAt);
  return booking.kind === 'exam'
    ? `Exame ${booking.examType?.name ?? ''} em ${booking.unit.name}, ${when}.`
    : `Consulta de ${booking.specialty?.name ?? ''} com ${booking.doctor?.fullName ?? ''} em ${when}.`;
}
