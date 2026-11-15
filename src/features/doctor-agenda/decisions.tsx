import type { ReactNode } from 'react';
import { LuCircleCheck, LuCircleCheckBig, LuUserX } from 'react-icons/lu';
import type { ButtonProps } from '@components/ui';
import type { DoctorAppointment } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { doctorApi } from './doctor-api';

export interface Decision {
  flag: Exclude<keyof DoctorAppointment['actions'], 'canCancel'>;
  label: string;
  loadingLabel: string;
  variant: ButtonProps['variant'];
  icon: ReactNode;
  success: string;
  send: (appointment: DoctorAppointment) => Promise<unknown>;
  confirmation?: {
    title: string;
    confirmLabel: string;
    description: (appointment: DoctorAppointment) => string;
  };
}

export const DECISIONS: readonly Decision[] = [
  {
    flag: 'canConfirm',
    label: 'Confirmar',
    loadingLabel: 'Confirmando',
    variant: 'success-outline',
    icon: <LuCircleCheck />,
    success: 'Consulta confirmada.',
    send: doctorApi.confirm,
  },
  {
    flag: 'canComplete',
    label: 'Concluir',
    loadingLabel: 'Concluindo',
    variant: 'success-outline',
    icon: <LuCircleCheckBig />,
    success: 'Consulta concluída.',
    send: doctorApi.complete,
  },
  {
    flag: 'canNoShow',
    label: 'Não compareceu',
    loadingLabel: 'Registrando falta',
    variant: 'danger-outline',
    icon: <LuUserX />,
    success: 'Falta registrada.',
    send: doctorApi.noShow,
    confirmation: {
      title: 'Registrar falta?',
      confirmLabel: 'Registrar falta',
      description: ({ patient, startsAt }) =>
        `${patient.fullName} não compareceu à consulta de ${formatDateTime(startsAt)}. Esse registro não pode ser desfeito.`,
    },
  },
];
