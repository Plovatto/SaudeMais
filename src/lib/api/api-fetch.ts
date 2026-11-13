import { env } from '@config/env';
import { ApiError, toApiError } from './api-error';
import type { paths } from './schema';

export const DEFAULT_TIMEOUT_MS = 15_000;

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
type MethodOf<P extends keyof paths> = {
  [M in Method]: paths[P][M] extends undefined ? never : M;
}[Method];
type Operation<P extends keyof paths, M extends MethodOf<P>> = NonNullable<paths[P][M]>;
type JsonOf<T> = T extends { content: { 'application/json': infer Body } } ? Body : undefined;
type Responses<P extends keyof paths, M extends MethodOf<P>> =
  Operation<P, M> extends { responses: infer R } ? R : never;
type SuccessStatus = 200 | 201 | 204;

export type ResponseOf<P extends keyof paths, M extends MethodOf<P>> = JsonOf<
  Responses<P, M>[Extract<keyof Responses<P, M>, SuccessStatus>]
>;
export type BodyOf<P extends keyof paths, M extends MethodOf<P>> =
  Operation<P, M> extends { requestBody?: infer R } ? JsonOf<NonNullable<R>> : never;

export interface ApiFetchOptions<Body> {
  body?: Body;
  signal?: AbortSignal;
  timeoutMs?: number;
  token?: string | null;
}

let tokenProvider: () => string | null = () => null;

export function setTokenProvider(provider: () => string | null): void {
  tokenProvider = provider;
}

function connectionError(timeout: AbortSignal, signal: AbortSignal | undefined, error: unknown): unknown {
  if (signal?.aborted) return error;
  if (timeout.aborted) return new ApiError(0, 'TIMEOUT', '');
  return new ApiError(0, 'NETWORK_ERROR', '');
}

async function readBody(
  response: Response,
  timeout: AbortSignal,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  if (response.status === 204) return undefined;
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    if (signal?.aborted || timeout.aborted) throw connectionError(timeout, signal, error);
    if (response.ok) throw new ApiError(response.status, 'INVALID_RESPONSE', '');
    return undefined;
  }
}

export async function apiFetch<P extends keyof paths, M extends MethodOf<P>>(
  method: M,
  path: P,
  { body, signal, timeoutMs = DEFAULT_TIMEOUT_MS, ...options }: ApiFetchOptions<BodyOf<P, M>> = {},
): Promise<ResponseOf<P, M>> {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = 'token' in options ? (options.token ?? null) : tokenProvider();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: method.toUpperCase(),
      headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
    });
  } catch (error) {
    throw connectionError(timeout, signal, error);
  }

  const data = await readBody(response, timeout, signal);
  if (!response.ok) {
    const error = toApiError(response.status, data);
    error.token = token;
    throw error;
  }
  return data as ResponseOf<P, M>;
}
