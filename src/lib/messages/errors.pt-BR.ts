import { ApiError } from '@lib/api/api-error';

export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente de novo em instantes.';

export const NO_LINK_MESSAGE =
  'Você só vê os resultados de um paciente com quem tem uma consulta de avaliação de exames confirmada ou concluída nos últimos 30 dias.';

export const errorMessages: Record<string, string> = {
  EMAIL_TAKEN: 'Este e-mail já está cadastrado.',
  NAME_TAKEN: 'Já existe um cadastro com esse nome.',
  CODE_TAKEN: 'Já existe um tipo de exame com esse código.',
  EXAM_TYPE_INACTIVE: 'Este tipo de exame está desativado. Ative-o antes de oferecê-lo.',
  COUNCIL_IN_USE: 'Há profissionais cadastrados nesta especialidade. O conselho não pode ser trocado.',
  IN_USE:
    'Há agendamentos futuros ligados a este item. Cancele ou conclua esses agendamentos antes de desativá-lo.',
  SELF_OR_LAST_ADMIN:
    'Não é possível fazer isso com a própria conta, e o sistema precisa de pelo menos um administrador ativo.',
  REGISTRY_TAKEN: 'Este registro profissional já está cadastrado em outra conta.',
  DOCTOR_PROFILE_EXISTS: 'Esta conta já tem perfil de médico.',
  RESET_NOT_SENT: 'Um link foi enviado há pouco ou o limite do dia foi atingido. Tente de novo mais tarde.',
  HAS_FUTURE_APPOINTMENTS:
    'Este médico tem consultas futuras. Cancele-as antes de trocar a especialidade ou a unidade.',
  SPECIALTY_UNAVAILABLE: 'Esta especialidade está desativada. Escolha outra.',
  UNIT_UNAVAILABLE: 'Esta unidade está desativada. Escolha outra.',
  SLOT_TAKEN: 'Este horário acabou de ser ocupado. Escolha outro.',
  NO_CAPACITY: 'Não há mais vagas neste horário. Escolha outro.',
  PATIENT_CONFLICT: 'Você já tem um agendamento neste horário. Escolha outro.',
  OUTSIDE_AVAILABILITY: 'Este horário não está mais disponível. Escolha outro da lista.',
  SAME_SLOT: 'Escolha um horário diferente do atual.',
  RESCHEDULE_WINDOW_CLOSED:
    'Falta pouco para o horário e este agendamento não pode mais ser reagendado. Você ainda pode cancelá-lo.',
  RESCHEDULE_LIMIT: 'Este agendamento já foi reagendado o máximo de vezes permitido.',
  ACTIVE_LIMIT:
    'Você atingiu o limite de agendamentos ativos. Cancele ou aguarde a conclusão de um deles antes de pedir outro.',
  SPECIALTY_MISMATCH: 'Este médico não atende a especialidade escolhida.',
  SELF_BOOKING: 'Não é possível agendar uma consulta com você mesmo.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  USER_INACTIVE: 'Esta conta está desativada.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem acesso a esta área.',
  FORBIDDEN_NO_LINK: NO_LINK_MESSAGE,
  PROTECTED_ACCOUNT: 'Esta é uma conta de demonstração e não pode ser alterada.',
  INVALID_STATE: 'Este agendamento mudou ou não pode mais ser alterado. Confira a lista atualizada.',
  NOT_STARTED: 'Esta consulta ainda não começou. Registre o desfecho a partir do horário de início.',
  INVALID_CURRENT_PASSWORD: 'A senha atual está incorreta.',
  CURRENT_SESSION: 'Esta é a sessão em uso. Para encerrá-la, saia da conta.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  SERVER_BUSY: 'O servidor está ocupado. Tente de novo em instantes.',
  VALIDATION_ERROR: 'Confira os campos destacados.',
  INTERNAL_ERROR: GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR: 'Não foi possível conectar. Verifique sua internet e tente de novo.',
  TIMEOUT: 'O servidor demorou para responder. Tente de novo.',
  INVALID_RESPONSE: GENERIC_ERROR_MESSAGE,
};

export type MessageOverrides = Readonly<Record<string, string>>;

export function messageFor(code: string, overrides: MessageOverrides = {}): string | undefined {
  if (Object.hasOwn(overrides, code)) return overrides[code];
  if (Object.hasOwn(errorMessages, code)) return errorMessages[code];
  return undefined;
}

export function errorMessage(error: unknown, overrides: MessageOverrides = {}): string {
  if (!(error instanceof ApiError)) return GENERIC_ERROR_MESSAGE;
  return messageFor(error.code, overrides) ?? (error.message || GENERIC_ERROR_MESSAGE);
}
