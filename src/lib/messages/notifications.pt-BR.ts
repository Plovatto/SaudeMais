import type { UserNotification } from '@lib/api/models';
import { formatDateTime } from '@lib/date';

type Params = UserNotification['params'];

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
  return startsAt ? ` de ${formatDateTime(startsAt)}` : '';
};

const cancellers: Record<string, string> = {
  patient: ' pelo paciente',
  doctor: ' pelo médico',
  admin: ' pela administração',
  system: ' pelo sistema',
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
    body: `A consulta${at(params)} foi cancelada${cancellers[textParam(params, 'cancelledByRole') ?? ''] ?? ''}.`,
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

export function notificationText({ type, params }: UserNotification): NotificationText {
  return notificationTexts[type]?.(params) ?? { title: 'Novo aviso', body: 'Você recebeu um novo aviso.' };
}
