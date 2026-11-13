import { ApiError } from '@lib/api/api-error';

export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente de novo em instantes.';

export const errorMessages: Record<string, string> = {
  EMAIL_TAKEN: 'Este e-mail já está cadastrado.',
  NAME_TAKEN: 'Já existe um cadastro com esse nome.',
  CODE_TAKEN: 'Já existe um tipo de exame com esse código.',
  EXAM_TYPE_INACTIVE: 'Este tipo de exame está desativado. Ative-o antes de oferecê-lo.',
  IN_USE:
    'Há agendamentos futuros ligados a este item. Cancele ou conclua esses agendamentos antes de desativá-lo.',
  NOT_FOUND: 'Este item não existe mais. Atualize a lista.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  USER_INACTIVE: 'Esta conta está desativada.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem acesso a esta área.',
  PROTECTED_ACCOUNT: 'Esta é uma conta de demonstração e não pode ser alterada.',
  INVALID_CURRENT_PASSWORD: 'A senha atual está incorreta.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  SERVER_BUSY: 'O servidor está ocupado. Tente de novo em instantes.',
  VALIDATION_ERROR: 'Confira os campos destacados.',
  INTERNAL_ERROR: GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR: 'Não foi possível conectar. Verifique sua internet e tente de novo.',
  TIMEOUT: 'O servidor demorou para responder. Tente de novo.',
  INVALID_RESPONSE: GENERIC_ERROR_MESSAGE,
};

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_ERROR_MESSAGE;
  if (Object.hasOwn(errorMessages, error.code)) return errorMessages[error.code] ?? GENERIC_ERROR_MESSAGE;
  return error.message || GENERIC_ERROR_MESSAGE;
}
