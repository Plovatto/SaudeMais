import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PATIENT } from '@constants/demo-accounts';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { mockFetch, renderApp, TEST_TOKEN, testUser, type MockResponse } from '@/test/render-app';

type Route = (method: string, body: unknown) => MockResponse | undefined;

const sessionsList = [
  {
    id: 's1',
    current: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
    createdAt: '2026-11-20T12:00:00.000Z',
    lastUsedAt: '2026-11-20T15:30:00.000Z',
    expiresAt: '2026-11-21T03:30:00.000Z',
  },
  {
    id: 's2',
    current: false,
    userAgent: null,
    createdAt: '2026-11-19T12:00:00.000Z',
    lastUsedAt: '2026-11-19T12:00:00.000Z',
    expiresAt: '2026-11-20T00:00:00.000Z',
  },
];

type ServedUser = Omit<ReturnType<typeof testUser>, 'phone'> & { phone: string | null };

function serve(user: ServedUser, routes: Record<string, Route> = {}) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
  return mockFetch((path, init) => {
    const method = init?.method ?? 'GET';
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const custom = routes[path]?.(method, body);
    if (custom) return custom;
    if (path === '/api/me' && method === 'GET') return { status: 200, body: user };
    if (path === '/api/me/sessions' && method === 'GET') return { status: 200, body: sessionsList };
    return undefined;
  });
}

const openProfile = (base = '/paciente') => renderApp(`${base}/perfil`);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('profile page', () => {
  it.each([
    [['patient'], '/paciente'],
    [['doctor'], '/medico'],
    [['admin'], '/admin'],
  ] as const)('exists in the %s area', async (roles, base) => {
    serve(testUser([...roles]));
    openProfile(base);

    expect(await screen.findByRole('heading', { name: 'Meu perfil' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@email.com');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly');
  });

  it('saves the name and shows it at once in the header', async () => {
    const patch = vi.fn((method: string, body: unknown) =>
      method === 'PATCH'
        ? { status: 200, body: { ...testUser(), fullName: 'Ana Souza', ...(body as object) } }
        : undefined,
    );
    serve(testUser(), { '/api/me': patch });
    const { user } = openProfile();

    const name = await screen.findByLabelText('Nome completo');
    await user.clear(name);
    await user.type(name, 'Ana Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados atualizados.')).toBeInTheDocument();
    expect(patch).toHaveBeenCalledWith('PATCH', { fullName: 'Ana Souza', phone: null });
    expect(screen.getAllByText('Ana Souza').length).toBeGreaterThan(0);
  });

  it('sends null to remove the phone', async () => {
    const patch = vi.fn((method: string) =>
      method === 'PATCH' ? { status: 200, body: testUser() } : undefined,
    );
    serve({ ...testUser(), phone: '+5511987654321' }, { '/api/me': patch });
    const { user } = openProfile();

    await user.clear(await screen.findByLabelText('Telefone'));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('PATCH', { fullName: 'Ana Maria Silva', phone: null }),
    );
  });

  it('validates the phone before calling the API', async () => {
    const patch = vi.fn(() => undefined);
    serve(testUser(), { '/api/me': patch });
    const { user } = openProfile();

    await user.type(await screen.findByLabelText('Telefone'), '123');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Informe um telefone válido com DDD.')).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalledWith('PATCH', expect.anything());
  });
});

describe('password change', () => {
  const fill = async (user: ReturnType<typeof openProfile>['user'], current = 'senha-segura-123') => {
    await user.type(await screen.findByLabelText('Senha atual'), current);
    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-456');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'nova-senha-456');
    await user.click(screen.getByRole('button', { name: 'Trocar senha' }));
  };

  it('puts a wrong current password on its field', async () => {
    serve(testUser(), {
      '/api/me/password': () => ({
        status: 422,
        body: {
          message: 'A senha atual está incorreta.',
          code: 'INVALID_CURRENT_PASSWORD',
          fields: { currentPassword: 'A senha atual está incorreta.' },
        },
      }),
    });
    const { user } = openProfile();

    await fill(user, 'senha-errada-000');

    expect(await screen.findByText('A senha atual está incorreta.')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true');
  });

  it('changes the password, clears the form and refreshes the sessions', async () => {
    const fetchMock = serve(testUser(), { '/api/me/password': () => ({ status: 204 }) });
    const { user } = openProfile();

    await fill(user);

    expect(
      await screen.findByText('Senha alterada. As outras sessões foram encerradas.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Senha atual')).toHaveValue('');
    const sessionCalls = fetchMock.mock.calls.filter(([url]) =>
      (typeof url === 'string' ? url : url instanceof URL ? url.href : url.url).endsWith('/api/me/sessions'),
    );
    expect(sessionCalls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('sessions', () => {
  it('lists the active sessions, marking this one', async () => {
    serve(testUser());
    openProfile();

    expect(await screen.findByText('Chrome no Windows')).toBeInTheDocument();
    expect(screen.getByText('Dispositivo desconhecido')).toBeInTheDocument();
    expect(screen.getByText('Esta sessão')).toBeInTheDocument();
    expect(screen.getByText('Último acesso em 20/11/2026, 12:30')).toBeInTheDocument();
  });

  it('signs out everywhere after confirming', async () => {
    const remove = vi.fn((method: string) => (method === 'DELETE' ? { status: 204 } : undefined));
    serve(testUser(), { '/api/me/sessions': remove });
    const { router, user } = openProfile();

    await user.click(await screen.findByRole('button', { name: 'Sair de todas as sessões' }));
    await user.click(await screen.findByRole('button', { name: 'Sair de todas' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(remove).toHaveBeenCalledWith('DELETE', undefined);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe('protected demo account', () => {
  it('shows the fields locked with an explanation', async () => {
    serve({ ...testUser(), email: DEMO_PATIENT.email });
    openProfile();

    expect(await screen.findByText(/conta de demonstração, compartilhada/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toBeDisabled();
    expect(screen.getByLabelText('Senha atual')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Trocar senha' })).toBeDisabled();
  });

  it('locks the forms when the API refuses a change to a protected account', async () => {
    const forbidden = {
      status: 403,
      body: {
        message: 'Esta é uma conta de demonstração e não pode ser alterada.',
        code: 'PROTECTED_ACCOUNT',
      },
    };
    serve(testUser(), { '/api/me': (method) => (method === 'PATCH' ? forbidden : undefined) });
    const { user } = openProfile();

    const name = await screen.findByLabelText('Nome completo');
    await user.type(name, ' Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText(/conta de demonstração, compartilhada/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toBeDisabled();
  });
});
