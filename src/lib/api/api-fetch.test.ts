import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, toApiError } from './api-error';
import { apiFetch, setTokenProvider } from './api-fetch';
import { getHealth } from './system-api';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  setTokenProvider(() => null);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('calls the API URL and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: 'ok' }));

    await expect(getHealth()).resolves.toEqual({ status: 'ok' });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://localhost:3001/health');
    expect(init?.method).toBe('GET');
  });

  it('sends JSON bodies and the session token when there is one', async () => {
    setTokenProvider(() => 'token-123');
    fetchMock.mockResolvedValue(jsonResponse(204));

    await apiFetch('post', '/api/users/logout');
    await apiFetch('post', '/api/users/login', {
      body: { email: 'ana@email.com', password: 'senha-segura-123', remember: false },
    });

    const [, logout] = fetchMock.mock.calls[0] ?? [];
    const [, login] = fetchMock.mock.calls[1] ?? [];
    expect(new Headers(logout?.headers).get('Authorization')).toBe('Bearer token-123');
    expect(new Headers(login?.headers).get('Content-Type')).toBe('application/json');
    expect(login?.body).toBe('{"email":"ana@email.com","password":"senha-segura-123","remember":false}');
  });

  it('turns an error response into an ApiError with code and fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        message: 'Este e-mail já está cadastrado.',
        code: 'EMAIL_TAKEN',
        fields: { email: 'x' },
      }),
    );

    const error = await apiFetch('get', '/health').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'EMAIL_TAKEN', fields: { email: 'x' } });
  });

  it('keeps 401 responses as UNAUTHENTICATED errors for the session layer', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { message: 'Sua sessão expirou. Entre novamente.', code: 'UNAUTHENTICATED' }),
    );

    await expect(apiFetch('get', '/api/me')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('reports a server error without a JSON body as INTERNAL_ERROR', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    await expect(apiFetch('get', '/health')).rejects.toMatchObject({ status: 502, code: 'INTERNAL_ERROR' });
  });

  it('rejects a successful response whose body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>SPA fallback</html>', { status: 200 }));

    await expect(apiFetch('get', '/health')).rejects.toMatchObject({ status: 200, code: 'INVALID_RESPONSE' });
  });

  it('reports a timeout while the body is still arriving as TIMEOUT', async () => {
    fetchMock.mockImplementation((_url, init) => {
      const body = new ReadableStream({
        start(controller) {
          init?.signal?.addEventListener('abort', () => {
            controller.error(init.signal?.reason);
          });
        },
      });
      return Promise.resolve(new Response(body, { status: 200 }));
    });

    await expect(apiFetch('get', '/health', { timeoutMs: 10 })).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('ignores field errors that are not an object of messages', () => {
    expect(toApiError(400, { code: 'VALIDATION_ERROR', fields: ['email'] }).fields).toEqual({});
  });

  it('reports a failed connection as NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiFetch('get', '/health')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('reports a request that takes too long as TIMEOUT', async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason as Error);
          });
        }),
    );

    await expect(apiFetch('get', '/health', { timeoutMs: 10 })).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('lets a request cancelled by the caller reject as an abort, not as a network error', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const request = apiFetch('get', '/health', { signal: controller.signal });
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
