import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider, type createBrowserRouter } from 'react-router';
import { vi } from 'vitest';
import { routes } from '@app/routes';
import { ToastProvider } from '@components/ui';
import type { Role } from '@constants/areas';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { createQueryClient } from '@lib/query-client';
import { queryKeys } from '@lib/query-keys';

export interface MockResponse {
  status: number;
  body?: unknown;
}

type Handler = (path: string, init?: RequestInit, url?: URL) => MockResponse | undefined;

export const TEST_TOKEN = 'A'.repeat(43);

export function mockFetch(handler: Handler) {
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const parsed = new URL(url instanceof Request ? url.url : url);
    const response = handler(parsed.pathname, init, parsed) ?? { status: 500 };
    await Promise.resolve();
    return new Response(response.body === undefined ? null : JSON.stringify(response.body), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function mockApi(...responses: MockResponse[]) {
  const queue = [...responses];
  return mockFetch(() => queue.shift());
}

export function testUser(roles: Role[] = ['patient']) {
  return {
    id: '0190c2a0-0000-7000-8000-000000000000',
    fullName: 'Ana Maria Silva',
    email: 'ana@email.com',
    phone: null,
    roles,
  };
}

export type ApiRoute = (method: string, body: unknown, url: URL) => MockResponse | undefined;

export interface ApiCall {
  method: string;
  url: URL;
  body: unknown;
}

export function serveApi(roles: Role[], routes: Record<string, ApiRoute>) {
  const calls: ApiCall[] = [];
  const fetchMock = signIn(roles, (path, init, url = new URL(path, 'https://api.test')) => {
    const method = init?.method ?? 'GET';
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, body });
    return routes[path]?.(method, body, url);
  });
  return { calls, fetchMock };
}

export function signIn(roles: Role[] = ['patient'], handler: Handler = () => undefined) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
  return mockFetch((path, init, url) =>
    path === '/api/me' && (init?.method ?? 'GET') === 'GET'
      ? { status: 200, body: testUser(roles) }
      : handler(path, init, url),
  );
}

type AppRouter = ReturnType<typeof createBrowserRouter>;

export function renderRouter(router: AppRouter, { signedInAs }: { signedInAs?: Role[] } = {}) {
  if (signedInAs) sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });
  if (signedInAs) queryClient.setQueryData(queryKeys.session, testUser(signedInAs));
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
  return { router, queryClient, user: userEvent.setup() };
}

export function renderApp(path: string, options: { basename?: string; signedInAs?: Role[] } = {}) {
  const { basename, ...session } = options;
  const router = createMemoryRouter(routes, { initialEntries: [path], ...(basename && { basename }) });
  return renderRouter(router, session);
}
