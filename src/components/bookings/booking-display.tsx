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

const statuses: Record<Exclude<BookingStatus, 'pending'> | 'awaiting', StatusDisplay> = {
  confirmed: { label: 'Confirmado', tone: 'success', icon: <LuCircleCheck /> },
  awaiting: { label: 'Aguardando registro', tone: 'info', icon: <LuCalendarClock /> },
  completed: { label: 'Concluída', tone: 'info', icon: <LuCircleCheckBig /> },
  cancelled: { label: 'Cancelada', tone: 'danger', icon: <LuCircleX /> },
  no_show: { label: 'Não compareceu', tone: 'neutral', icon: <LuUserX /> },
  expired: { label: 'Não confirmada', tone: 'neutral', icon: <LuCalendarX /> },
};

export function bookingStatus(
  { status, startsAt }: { status: BookingStatus; startsAt: string },
  viewer: Role,
  now = Date.now(),
): StatusDisplay {
  if (status === 'pending') {
    return {
      label: viewer === 'doctor' ? 'A confirmar' : 'Pendente',
      tone: 'warning',
      icon: <LuHourglass />,
    };
  }
  const started = new Date(startsAt).getTime() <= now;
  return statuses[status === 'confirmed' && started ? 'awaiting' : status];
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
