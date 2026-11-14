import { ApiError } from '@lib/api/api-error';

export const staleMessages = { NOT_FOUND: 'Este agendamento não existe mais. Confira a lista atualizada.' };

const STALE_STATUSES = new Set([404, 409]);

export const isStale = (error: unknown) => error instanceof ApiError && STALE_STATUSES.has(error.status);
