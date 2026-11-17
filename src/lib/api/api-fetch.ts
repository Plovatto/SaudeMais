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
type SuccessStatus = 200 | 201 | 202 | 204;

const EMPTY_STATUSES = new Set([202, 204]);

export type ResponseOf<P extends keyof paths, M extends MethodOf<P>> = JsonOf<
  Responses<P, M>[Extract<keyof Responses<P, M>, SuccessStatus>]
>;
export type BodyOf<P extends keyof paths, M extends MethodOf<P>> =
  Operation<P, M> extends { requestBody?: infer R } ? JsonOf<NonNullable<R>> : never;

type PathParamsOf<P extends keyof paths, M extends MethodOf<P>> =
  Operation<P, M> extends { parameters: { path: infer Params } } ? Params : never;

export type QueryValue = string | number | boolean | undefined;

export interface ApiFetchOptions<Body, Params = Record<string, string>> {
  body?: Body;
  params?: Params;
  query?: Record<string, QueryValue>;
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
  if (EMPTY_STATUSES.has(response.status)) return undefined;
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    if (signal?.aborted || timeout.aborted) throw connectionError(timeout, signal, error);
    if (response.ok) throw new ApiError(response.status, 'INVALID_RESPONSE', '');
    return undefined;
  }
}

function urlOf(
  path: string,
  params: Record<string, string> = {},
  query: Record<string, QueryValue> = {},
): string {
  const resolved = path.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path parameter: ${name}`);
    return encodeURIComponent(value);
  });
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) search.set(key, String(value));
  const suffix = search.toString();
  return `${env.apiUrl}${resolved}${suffix ? `?${suffix}` : ''}`;
}

async function send(
  method: Method,
  url: string,
  accept: string,
  {
    body,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...options
  }: Omit<ApiFetchOptions<unknown>, 'params' | 'query'>,
) {
  const headers = new Headers({ Accept: accept });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = 'token' in options ? (options.token ?? null) : tokenProvider();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
    });
  } catch (error) {
    throw connectionError(timeout, signal, error);
  }

  if (!response.ok) {
    const error = toApiError(response.status, await readBody(response, timeout, signal));
    error.token = token;
    throw error;
  }
  return { response, timeout };
}

export async function apiFetch<P extends keyof paths, M extends MethodOf<P>>(
  method: M,
  path: P,
  { params, query, ...options }: ApiFetchOptions<BodyOf<P, M>, PathParamsOf<P, M>> = {},
): Promise<ResponseOf<P, M>> {
  const url = urlOf(path, params as Record<string, string> | undefined, query);
  const { response, timeout } = await send(method, url, 'application/json', options);
  return (await readBody(response, timeout, options.signal)) as ResponseOf<P, M>;
}

export async function apiDownload<P extends keyof paths>(
  path: P,
  { params, query, ...options }: ApiFetchOptions<never, PathParamsOf<P, MethodOf<P>>> = {},
): Promise<Blob> {
  const url = urlOf(path, params as Record<string, string> | undefined, query);
  const { response, timeout } = await send('get', url, '*/*', options);
  try {
    return await response.blob();
  } catch (error) {
    throw connectionError(timeout, options.signal, error);
  }
}
