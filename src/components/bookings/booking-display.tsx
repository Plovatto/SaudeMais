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
import type { PatientBooking } from '@lib/api/models';

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

export function bookingTitle({ kind, doctor, specialty, examType, unit }: PatientBooking) {
  return kind === 'exam'
    ? { title: unit.name, subtitle: `Exame · ${examType?.name ?? ''}` }
    : { title: doctor?.fullName ?? '', subtitle: specialty?.name ?? '' };
}

export const UPCOMING_EMPTY = {
  title: 'Nenhum agendamento futuro',
  description: 'Agende uma consulta ou um exame para acompanhar por aqui.',
};
