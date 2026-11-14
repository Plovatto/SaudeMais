import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '@constants/areas';
import type { UserNotification } from '@lib/api/models';
import { queryKeys } from '@lib/query-keys';
import { renderApp, serveApi, type ApiCall, type MockResponse } from '@/test/render-app';

const FUTURE = '2030-07-19T18:30:00.000Z';
const HOUR_MS = 3_600_000;
const POLL_MS = 120_000;
const DEMO = { status: 403, body: { code: 'PROTECTED_ACCOUNT', message: 'Conta de demonstração.' } };

const notification = (id: string, overrides: Partial<UserNotification> = {}): UserNotification => ({
  id,
  type: 'appointment_confirmed',
  params: { startsAt: FUTURE },
  bookingId: 'b1',
  readAt: null,
  createdAt: new Date(Date.now() - 2 * HOUR_MS).toISOString(),
  ...overrides,
});

interface Setup {
  roles?: Role[];
  count?: number;
  items?: UserNotification[];
  total?: number;
  read?: MockResponse;
  readAll?: MockResponse;
}

function serve({ roles = ['patient'], count = 0, items = [], total, read, readAll }: Setup = {}) {
  const state = { count };
  const settle = (response: MockResponse | undefined, next: number) => {
    if (response) return response;
    state.count = next;
    return { status: 204 };
  };
  const api = serveApi(roles, {
    '/api/notifications/unread-count': () => ({ status: 200, body: { count: state.count } }),
    '/api/notifications': (_method, _body, url) => ({
      status: 200,
      body: {
        items,
        page: Number(url.searchParams.get('page')),
        pageSize: Number(url.searchParams.get('pageSize')),
        total: total ?? items.length,
      },
    }),
    '/api/notifications/read-all': () => settle(readAll, 0),
    '/api/notifications/n1/read': () => settle(read, Math.max(0, state.count - 1)),
  });
  return { ...api, state };
}

const callsTo = (calls: ApiCall[], pathname: string, method = 'GET') =>
  calls.filter((call) => call.method === method && call.url.pathname === pathname);

const countCalls = (calls: ApiCall[]) => callsTo(calls, '/api/notifications/unread-count');

const bell = (name: string | RegExp = /^Notificações/) => screen.findByRole('button', { name });

async function openPopover(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await bell());
  return within(await screen.findByRole('dialog', { name: 'Notificações' }));
}

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
};

describe('notifications', { timeout: 15_000 }, () => {
  afterEach(() => {
    vi.useRealTimers();
    setVisibility('visible');
  });

  it.each([
    [0, 'Notificações', null],
    [1, 'Notificações, 1 não lida', '1'],
    [3, 'Notificações, 3 não lidas', '3'],
    [12, 'Notificações, 12 não lidas', '9+'],
  ])('labels the bell for %i unread', async (count, label, badge) => {
    const { calls } = serve({ count });
    renderApp('/paciente/exames/novo');

    expect((await bell(label)).textContent).toBe(badge ?? '');
    expect(countCalls(calls).every((call) => call.url.searchParams.get('role') === 'patient')).toBe(true);
  });

  it('asks for the counter and the list of the open area role', async () => {
    const { calls } = serve({ roles: ['patient', 'doctor'], count: 2 });
    const { user } = renderApp('/medico');

    await bell('Notificações, 2 não lidas');
    await openPopover(user);

    await waitFor(() => expect(callsTo(calls, '/api/notifications')).not.toHaveLength(0));
    const lists = callsTo(calls, '/api/notifications').map(({ url }) => Object.fromEntries(url.searchParams));
    expect(lists.every((query) => query.role === 'doctor' && query.page === '1')).toBe(true);
    expect(countCalls(calls).every((call) => call.url.searchParams.get('role') === 'doctor')).toBe(true);
  });

  it('polls the counter every two minutes only while the tab is visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { calls } = serve({ count: 1 });
    renderApp('/paciente/exames/novo');
    await bell('Notificações, 1 não lida');
    const initial = countCalls(calls).length;

    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    await waitFor(() => expect(countCalls(calls)).toHaveLength(initial + 1));

    act(() => setVisibility('hidden'));
    await act(() => vi.advanceTimersByTimeAsync(3 * POLL_MS));
    expect(countCalls(calls)).toHaveLength(initial + 1);

    act(() => setVisibility('visible'));
    await waitFor(() => expect(countCalls(calls)).toHaveLength(initial + 2));
  });

  it('announces the counter only when it grows', async () => {
    const { state } = serve({ count: 1 });
    const { queryClient } = renderApp('/paciente/exames/novo');
    await bell('Notificações, 1 não lida');
    expect(screen.queryByText(/Nova notificação/)).not.toBeInTheDocument();
    const refresh = async (count: number) => {
      state.count = count;
      await act(() => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }));
    };

    await refresh(3);
    await bell('Notificações, 3 não lidas');
    const announcement = screen.getByText('Nova notificação. 3 não lidas.');
    expect(announcement).toHaveAttribute('role', 'status');

    await refresh(2);
    await bell('Notificações, 2 não lidas');
    expect(announcement).toHaveTextContent('Nova notificação. 3 não lidas.');
  });

  it('opens the popover, closes it with Escape and returns the focus to the bell', async () => {
    serve({
      count: 1,
      items: [
        notification('n1'),
        notification('n2', { type: 'appointment_cancelled', readAt: new Date().toISOString() }),
      ],
    });
    const { user } = renderApp('/paciente/exames/novo');

    const popover = await openPopover(user);
    const [unread, read] = (await popover.findAllByRole('link')).slice(0, 2);
    expect(unread).toHaveTextContent('Consulta confirmada!');
    expect(unread).toHaveTextContent('(não lida)');
    expect(unread).toHaveTextContent('há 2 h');
    expect(read).toHaveTextContent('Consulta cancelada');
    expect(read).not.toHaveTextContent('(não lida)');
    expect(popover.getByRole('link', { name: 'Ver todas' })).toHaveAttribute(
      'href',
      '/notificacoes?perfil=paciente',
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Notificações' })).not.toBeInTheDocument();
    expect(await bell()).toHaveFocus();
  });

  it('shows an empty state and disables mark all without unread notices', async () => {
    serve();
    const { user } = renderApp('/paciente/exames/novo');

    const popover = await openPopover(user);
    expect(await popover.findByText('Nenhuma notificação')).toBeVisible();
    expect(popover.getByRole('button', { name: 'Marcar todas como lidas' })).toBeDisabled();
  });

  it('marks a notice as read, opens its target and closes the popover', async () => {
    const { calls } = serve({ count: 1, items: [notification('n1')] });
    const { user, router } = renderApp('/paciente/exames/novo');

    const popover = await openPopover(user);
    await user.click(await popover.findByRole('link', { name: /Consulta confirmada!/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(screen.queryByRole('dialog', { name: 'Notificações' })).not.toBeInTheDocument();
    await waitFor(() => expect(callsTo(calls, '/api/notifications/n1/read', 'POST')).toHaveLength(1));
    expect(await bell('Notificações')).toBeInTheDocument();
  });

  it('still opens the target when a demo account cannot mark it as read', async () => {
    serve({ count: 1, items: [notification('n1', { type: 'appointment_expired' })], read: DEMO });
    const { user, router } = renderApp('/paciente/exames/novo');

    const popover = await openPopover(user);
    await user.click(await popover.findByRole('link', { name: /Pedido não confirmado/ }));

    await waitFor(() => expect(router.state.location.search).toBe('?aba=realizados'));
    expect(screen.queryByText('Conta de demonstração.')).not.toBeInTheDocument();
  });

  it('marks every notice of the area role as read', async () => {
    const { calls } = serve({ roles: ['patient', 'doctor'], count: 2, items: [notification('n1')] });
    const { user } = renderApp('/medico');

    const popover = await openPopover(user);
    await user.click(popover.getByRole('button', { name: 'Marcar todas como lidas' }));

    await waitFor(() => expect(callsTo(calls, '/api/notifications/read-all', 'POST')).toHaveLength(1));
    expect(callsTo(calls, '/api/notifications/read-all', 'POST')[0]?.url.searchParams.get('role')).toBe(
      'doctor',
    );
    await waitFor(() =>
      expect(popover.getByRole('button', { name: 'Marcar todas como lidas' })).toBeDisabled(),
    );
    expect(await bell('Notificações')).toBeInTheDocument();
  });

  it('tells a demo account that notices cannot be marked as read', async () => {
    serve({ count: 2, items: [notification('n1')], readAll: DEMO });
    const { user } = renderApp('/paciente/exames/novo');

    const popover = await openPopover(user);
    await user.click(popover.getByRole('button', { name: 'Marcar todas como lidas' }));

    expect(
      await screen.findByText(
        'Esta é uma conta de demonstração: as notificações podem ser vistas, mas não marcadas como lidas.',
      ),
    ).toBeVisible();
    expect(screen.queryByText('Conta de demonstração.')).not.toBeInTheDocument();
  });

  it('opens the page of the area role from the popover', async () => {
    const { calls } = serve({ roles: ['patient', 'doctor'], items: [notification('n1')] });
    const { user, router } = renderApp('/medico');

    const popover = await openPopover(user);
    await user.click(popover.getByRole('link', { name: 'Ver todas' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/notificacoes'));
    expect(router.state.location.search).toBe('?perfil=medico');
    expect(await screen.findByRole('heading', { level: 1, name: 'Notificações' })).toBeVisible();
    expect(screen.getByText('Perfil Médico')).toBeVisible();
    await waitFor(() =>
      expect(callsTo(calls, '/api/notifications').at(-1)?.url.searchParams.get('pageSize')).toBe('20'),
    );
    expect(callsTo(calls, '/api/notifications').at(-1)?.url.searchParams.get('role')).toBe('doctor');
  });

  it('paginates the page', async () => {
    const { calls } = serve({
      roles: ['admin'],
      items: [notification('n1', { type: 'user_registered' })],
      total: 45,
    });
    const { user, router } = renderApp('/notificacoes?perfil=admin');

    const link = await screen.findByRole('link', { name: /Novo usuário cadastrado/ });
    expect(link).toHaveAttribute('href', '/admin/usuarios');
    await user.click(screen.getByRole('button', { name: 'Página 3' }));

    await waitFor(() => expect(router.state.location.search).toBe('?perfil=admin&pagina=3'));
    await waitFor(() =>
      expect(callsTo(calls, '/api/notifications').at(-1)?.url.searchParams.get('page')).toBe('3'),
    );
    expect(callsTo(calls, '/api/notifications').at(-1)?.url.searchParams.get('role')).toBe('admin');
  });

  it('uses the first role of the account without a profile in the address', async () => {
    const { calls } = serve({ roles: ['admin'] });
    renderApp('/notificacoes');

    expect(await screen.findByText('Perfil Administrador')).toBeVisible();
    await waitFor(() => expect(callsTo(calls, '/api/notifications')).not.toHaveLength(0));
    expect(callsTo(calls, '/api/notifications')[0]?.url.searchParams.get('role')).toBe('admin');
  });

  it('denies the page of a role the account does not have', async () => {
    serve({ roles: ['patient'] });
    renderApp('/notificacoes?perfil=admin');

    expect(await screen.findByRole('heading', { name: 'Acesso negado' })).toBeVisible();
  });
});
