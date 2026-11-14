import { areas, type Role } from '@constants/areas';
import { AGENDA_TABS, doctorAgendaUrl } from '@constants/doctor-agenda';
import type { PatientBooking, UserNotification } from '@lib/api/models';
import { formatDateTime } from '@lib/date';

type Params = UserNotification['params'];
type Canceller = NonNullable<PatientBooking['cancellation']>['byRole'];

interface NotificationText {
  title: string;
  body: string;
}

const textParam = (params: Params, key: string) => {
  const value = params[key];
  return typeof value === 'string' && value.trim() ? value : null;
};

const at = (params: Params) => {
  const startsAt = textParam(params, 'startsAt');
  return startsAt && !Number.isNaN(Date.parse(startsAt)) ? ` de ${formatDateTime(startsAt)}` : '';
};

export const cancellers: Record<Canceller, string> = {
  patient: 'pelo paciente',
  doctor: 'pelo médico',
  admin: 'pela administração',
  system: 'pelo sistema',
};

const cancelledBy = (params: Params) => {
  const role = textParam(params, 'cancelledByRole');
  return role && Object.hasOwn(cancellers, role) ? ` ${cancellers[role as Canceller]}` : '';
};

const notificationTexts: Record<UserNotification['type'], (params: Params) => NotificationText> = {
  appointment_requested: (params) => ({
    title: 'Novo pedido de consulta',
    body: `Há um pedido de consulta${at(params)} aguardando sua confirmação.`,
  }),
  appointment_rescheduled: (params) => ({
    title: 'Pedido reagendado',
    body: `O paciente pediu um novo horário: consulta${at(params)}.`,
  }),
  appointment_cancelled_by_patient: (params) => ({
    title: 'Consulta cancelada pelo paciente',
    body: `A consulta${at(params)} foi cancelada pelo paciente.`,
  }),
  appointment_confirmed: (params) => ({
    title: 'Consulta confirmada!',
    body: `Sua consulta${at(params)} foi confirmada pelo médico.`,
  }),
  appointment_cancelled: (params) => ({
    title: 'Consulta cancelada',
    body: `A consulta${at(params)} foi cancelada${cancelledBy(params)}.`,
  }),
  appointment_expired: (params) => ({
    title: 'Pedido não confirmado',
    body: `O pedido de consulta${at(params)} não foi confirmado a tempo. Escolha outro horário.`,
  }),
  exam_result_available: (params) => ({
    title: 'Resultado de exame disponível',
    body: `O resultado do seu exame${at(params)} já pode ser consultado.`,
  }),
  user_registered: (params) => ({
    title: 'Novo usuário cadastrado',
    body: `${textParam(params, 'fullName') ?? 'Uma pessoa'} criou uma conta no Saúde+.`,
  }),
};

const DEFAULT_TEXT: NotificationText = { title: 'Novo aviso', body: 'Você recebeu um novo aviso.' };

export function notificationText({
  type,
  params,
}: Pick<UserNotification, 'type' | 'params'>): NotificationText {
  return notificationTexts[type]?.(params) ?? DEFAULT_TEXT;
}

const patientBookings = `${areas.patient.base}/agendamentos`;
const patientPast = `${patientBookings}?aba=realizados`;
const doctorHistory = doctorAgendaUrl(AGENDA_TABS.history);

export function notificationTarget({ type }: UserNotification, role: Role): string {
  switch (type) {
    case 'appointment_requested':
    case 'appointment_rescheduled':
      return doctorAgendaUrl(AGENDA_TABS.pending);
    case 'appointment_cancelled_by_patient':
      return doctorHistory;
    case 'appointment_confirmed':
      return patientBookings;
    case 'appointment_cancelled':
      return role === 'doctor' ? doctorHistory : patientPast;
    case 'appointment_expired':
    case 'exam_result_available':
      return patientPast;
    case 'user_registered':
      return `${areas.admin.base}/usuarios`;
    default:
      return areas[role].base;
  }
}
