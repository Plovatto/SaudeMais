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

export interface StatusDisplay {
  label: string;
  tone: StatusChipProps['tone'];
  icon: ReactNode;
}

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'expired';

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
