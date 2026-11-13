export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldErrors;
  token: string | null = null;

  constructor(status: number, code: string, message: string, fields: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isUnauthenticated(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}

interface ErrorBody {
  message?: unknown;
  code?: unknown;
  fields?: unknown;
}

function isFieldErrors(value: unknown): value is FieldErrors {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((message) => typeof message === 'string')
  );
}

export function toApiError(status: number, body: unknown): ApiError {
  const { message, code, fields } = (typeof body === 'object' && body !== null ? body : {}) as ErrorBody;
  return new ApiError(
    status,
    typeof code === 'string' ? code : status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR',
    typeof message === 'string' ? message : '',
    isFieldErrors(fields) ? fields : {},
  );
}
