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
}

let tokenProvider: () => string | null = () => null;

export function setTokenProvider(provider: () => string | null): void {
  tokenProvider = provider;
}

function connectionError(timeout: AbortSignal, signal: AbortSignal | undefined, error: unknown): unknown {
  if (signal?.aborted) return error;
  if (timeout.aborted) return new ApiError(0, 'TIMEOUT', 'O servidor demorou para responder.');
  return new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar ao servidor.');
}

export async function apiFetch<P extends keyof paths, M extends MethodOf<P>>(
  method: M,
  path: P,
  { body, signal, timeoutMs = DEFAULT_TIMEOUT_MS }: ApiFetchOptions<BodyOf<P, M>> = {},
): Promise<ResponseOf<P, M>> {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = tokenProvider();
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

  const data: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) throw toApiError(response.status, data);
  return data as ResponseOf<P, M>;
}
