import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_DOCTOR, DEMO_PATIENT } from '@constants/demo-accounts';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { THEME_STORAGE_KEY } from '@lib/theme';
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

const preferences = [
  { topic: 'booking_reminder', role: 'patient', enabled: true },
  { topic: 'exam_result', role: 'patient', enabled: false },
];

type ServedUser = Omit<ReturnType<typeof testUser>, 'phone'> & {
  phone: string | null;
  birthDate?: string | null;
  passwordChangedAt?: string | null;
};

const protectedError = {
  status: 403,
  body: { message: 'Esta é uma conta de demonstração e não pode ser alterada.', code: 'PROTECTED_ACCOUNT' },
};

function serve(user: ServedUser, routes: Record<string, Route> = {}) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
  return mockFetch((path, init) => {
    const method = init?.method ?? 'GET';
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const custom = routes[path]?.(method, body);
    if (custom) return custom;
    if (path === '/api/me' && method === 'GET') return { status: 200, body: user };
    if (path === '/api/me/sessions' && method === 'GET') return { status: 200, body: sessionsList };
    if (path === '/api/me/email-preferences' && method === 'GET') return { status: 200, body: preferences };
    return undefined;
  });
}

const openProfile = (base = '/paciente') => renderApp(`${base}/perfil`);

type User = ReturnType<typeof openProfile>['user'];

async function openDrawer(user: User, opener: string) {
  await user.click(await screen.findByRole('button', { name: opener }));
  return within(await screen.findByRole('dialog'));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
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
    expect(screen.getAllByText('ana@email.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Fixo')).toBeInTheDocument();
  });

  it('shows the birth date and age only in the patient area', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-17T12:00:00.000Z') });
    serve({ ...testUser(['patient', 'doctor']), birthDate: '1986-03-12' });
    openProfile();

    expect(await screen.findByText('12/03/1986 · 40 anos')).toBeInTheDocument();
    expect(screen.getByText('40 anos')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('keeps the e-mail read-only in the edit drawer', async () => {
    serve(testUser());
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');

    expect(drawer.getByLabelText('E-mail')).toHaveValue('ana@email.com');
    expect(drawer.getByLabelText('E-mail')).toHaveAttribute('readonly');
  });

  it('saves the name and shows it at once in the header', async () => {
    const patch = vi.fn((method: string, body: unknown) =>
      method === 'PATCH' ? { status: 200, body: { ...testUser(), ...(body as object) } } : undefined,
    );
    serve(testUser(), { '/api/me': patch });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    const name = drawer.getByLabelText('Nome completo');
    await user.clear(name);
    await user.type(name, 'Ana Souza');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados atualizados.')).toBeInTheDocument();
    expect(patch).toHaveBeenCalledWith('PATCH', { fullName: 'Ana Souza', phone: null, birthDate: null });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByText('Ana Souza').length).toBeGreaterThan(0);
  });

  it('saves the birth date for patients', async () => {
    const patch = vi.fn((method: string, body: unknown) =>
      method === 'PATCH' ? { status: 200, body: { ...testUser(), ...(body as object) } } : undefined,
    );
    serve(testUser(), { '/api/me': patch });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    await user.type(drawer.getByLabelText('Data de nascimento'), '1986-03-12');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('PATCH', {
        fullName: 'Ana Maria Silva',
        phone: null,
        birthDate: '1986-03-12',
      }),
    );
    expect(await screen.findByText(/12\/03\/1986/)).toBeInTheDocument();
  });

  it('rejects a birth date in the future', async () => {
    const patch = vi.fn(() => undefined);
    serve(testUser(), { '/api/me': patch });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    await user.type(drawer.getByLabelText('Data de nascimento'), '2999-01-01');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    expect(await drawer.findByText('Informe uma data de nascimento entre 1900 e hoje.')).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalledWith('PATCH', expect.anything());
  });

  it('does not send the birth date outside the patient area', async () => {
    const patch = vi.fn((method: string) =>
      method === 'PATCH' ? { status: 200, body: testUser(['doctor']) } : undefined,
    );
    serve(testUser(['doctor']), { '/api/me': patch });
    const { user } = openProfile('/medico');

    const drawer = await openDrawer(user, 'Editar perfil');
    expect(drawer.queryByLabelText('Data de nascimento')).not.toBeInTheDocument();
    await user.type(drawer.getByLabelText('Telefone'), '11987654321');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('PATCH', { fullName: 'Ana Maria Silva', phone: '11987654321' }),
    );
  });

  it('sends null to remove the phone', async () => {
    const patch = vi.fn((method: string) =>
      method === 'PATCH' ? { status: 200, body: testUser() } : undefined,
    );
    serve({ ...testUser(), phone: '+5511987654321' }, { '/api/me': patch });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar dados pessoais');
    await user.clear(drawer.getByLabelText('Telefone'));
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('PATCH', {
        fullName: 'Ana Maria Silva',
        phone: null,
        birthDate: null,
      }),
    );
  });

  it('validates the phone before calling the API', async () => {
    const patch = vi.fn(() => undefined);
    serve(testUser(), { '/api/me': patch });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    await user.type(drawer.getByLabelText('Telefone'), '123');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    expect(await drawer.findByText('Informe um telefone válido com DDD.')).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalledWith('PATCH', expect.anything());
  });

  it('asks before leaving the account', async () => {
    serve(testUser(), { '/api/users/logout': () => ({ status: 204 }) });
    const { router, user } = openProfile();

    const dialog = await openDrawer(user, 'Sair da conta');
    await user.click(dialog.getByRole('button', { name: 'Continuar aqui' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/paciente/perfil');

    const again = await openDrawer(user, 'Sair da conta');
    await user.click(again.getByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe('appearance', () => {
  it('switches between light, dark and system themes', async () => {
    serve(testUser());
    const { user } = openProfile();

    await user.click(await screen.findByRole('radio', { name: 'Escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Sistema' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked();
  });
});

describe('email preferences', () => {
  it('lists the topics and saves a change', async () => {
    const patch = vi.fn((method: string) =>
      method === 'PATCH'
        ? { status: 200, body: preferences.map((item) => ({ ...item, enabled: true })) }
        : undefined,
    );
    serve(testUser(), { '/api/me/email-preferences': patch });
    const { user } = openProfile();

    expect(await screen.findByRole('switch', { name: 'Lembrete por e-mail' })).toBeChecked();
    const result = screen.getByRole('switch', { name: 'Resultado disponível' });
    expect(result).not.toBeChecked();

    await user.click(result);

    expect(patch).toHaveBeenCalledWith('PATCH', { preferences: [{ topic: 'exam_result', enabled: true }] });
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked());
  });

  it('reverts the switch and explains when saving fails', async () => {
    serve(testUser(), {
      '/api/me/email-preferences': (method) =>
        method === 'PATCH' ? { status: 500, body: { message: 'Erro', code: 'INTERNAL_ERROR' } } : undefined,
    });
    const { user } = openProfile();

    await user.click(await screen.findByRole('switch', { name: 'Resultado disponível' }));

    expect(await screen.findByText('Algo deu errado. Tente de novo em instantes.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Resultado disponível' })).not.toBeChecked();
  });
});

describe('password change', () => {
  const fill = async (user: User, current = 'senha-segura-123') => {
    const drawer = await openDrawer(user, 'Alterar senha');
    await user.type(drawer.getByLabelText('Senha atual'), current);
    await user.type(drawer.getByLabelText('Nova senha'), 'nova-senha-456');
    await user.type(drawer.getByLabelText('Confirmar nova senha'), 'nova-senha-456');
    await user.click(drawer.getByRole('button', { name: 'Alterar senha' }));
    return drawer;
  };

  it('shows when the password was last changed', async () => {
    serve({ ...testUser(), passwordChangedAt: '2026-08-10T12:00:00.000Z' });
    openProfile();

    expect(await screen.findByText('Última alteração em 10/08/2026')).toBeInTheDocument();
  });

  it('shows how strong the new password is', async () => {
    serve(testUser());
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Alterar senha');
    expect(drawer.getByText('Escolha uma senha forte')).toBeInTheDocument();
    await user.type(drawer.getByLabelText('Nova senha'), 'abc12345');

    expect(drawer.getByText('Senha média')).toBeInTheDocument();
    expect(drawer.getByText('Letras e números')).toHaveTextContent('atendido');
  });

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

    const drawer = await fill(user, 'senha-errada-000');

    expect(await drawer.findByText('A senha atual está incorreta.')).toBeInTheDocument();
    expect(drawer.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true');
  });

  it('changes the password, closes the drawer and refreshes the sessions', async () => {
    const fetchMock = serve(testUser(), { '/api/me/password': () => ({ status: 204 }) });
    const { user } = openProfile();

    await fill(user);

    expect(
      await screen.findByText('Senha alterada. As outras sessões foram encerradas.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
    expect(screen.getByText('2 aparelhos')).toBeInTheDocument();
    expect(screen.getByText('Último acesso em 20/11/2026, 12:30')).toBeInTheDocument();
  });

  it('ends another session', async () => {
    const remove = vi.fn((method: string) => (method === 'DELETE' ? { status: 204 } : undefined));
    serve(testUser(), { '/api/me/sessions/s2': remove });
    const { user } = openProfile();

    await user.click(
      await screen.findByRole('button', { name: 'Encerrar sessão: Dispositivo desconhecido' }),
    );

    expect(await screen.findByText('Sessão encerrada.')).toBeInTheDocument();
    expect(remove).toHaveBeenCalledWith('DELETE', undefined);
  });

  it('explains when the session is the one in use', async () => {
    serve(testUser(), {
      '/api/me/sessions/s2': () => ({
        status: 422,
        body: { message: 'Esta é a sessão em uso.', code: 'CURRENT_SESSION' },
      }),
    });
    const { user } = openProfile();

    await user.click(
      await screen.findByRole('button', { name: 'Encerrar sessão: Dispositivo desconhecido' }),
    );

    expect(
      await screen.findByText('Esta é a sessão em uso. Para encerrá-la, saia da conta.'),
    ).toBeInTheDocument();
  });

  it('ends the other sessions', async () => {
    const remove = vi.fn((method: string) => (method === 'DELETE' ? { status: 204 } : undefined));
    serve(testUser(), { '/api/me/sessions/others': remove });
    const { user } = openProfile();

    await user.click(await screen.findByRole('button', { name: 'Encerrar as outras' }));

    expect(await screen.findByText('As outras sessões foram encerradas.')).toBeInTheDocument();
    expect(remove).toHaveBeenCalledWith('DELETE', undefined);
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

describe('sessions failures', () => {
  it('explains when the sessions cannot be loaded', async () => {
    serve(testUser(), {
      '/api/me/sessions': (method) =>
        method === 'GET' ? { status: 403, body: { message: 'Sem acesso.', code: 'FORBIDDEN' } } : undefined,
    });
    openProfile();

    await waitFor(() =>
      expect(screen.getAllByRole('alert').some((element) => element.textContent?.trim())).toBe(true),
    );
  });

  it('keeps the session and shows the error when signing out everywhere fails', async () => {
    serve(testUser(), {
      '/api/me/sessions': (method) =>
        method === 'DELETE' ? { status: 500, body: { message: 'Erro', code: 'INTERNAL_ERROR' } } : undefined,
    });
    const { router, user } = openProfile();

    await user.click(await screen.findByRole('button', { name: 'Sair de todas as sessões' }));
    await user.click(await screen.findByRole('button', { name: 'Sair de todas' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByRole('alert').some((element) => element.textContent?.trim())).toBe(true);
    expect(router.state.location.pathname).toBe('/paciente/perfil');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(TEST_TOKEN);
  });
});

describe('protected demo account', () => {
  it.each([DEMO_PATIENT, DEMO_DOCTOR])(
    'shows the $label account locked with an explanation',
    async ({ email }) => {
      serve({ ...testUser(), email });
      openProfile();

      expect(await screen.findByText(/conta de demonstração, compartilhada/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled();
      expect(await screen.findByRole('switch', { name: 'Lembrete por e-mail' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Encerrar as outras' })).toBeDisabled();
    },
  );

  it('locks the profile when the API refuses a change to a protected account', async () => {
    serve(testUser(), { '/api/me': (method) => (method === 'PATCH' ? protectedError : undefined) });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    await user.type(drawer.getByLabelText('Nome completo'), ' Souza');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText(/conta de demonstração, compartilhada/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeDisabled();
    expect(screen.queryByText('Ana Maria Silva Souza')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Esta é uma conta de demonstração e não pode ser alterada.'),
    ).not.toBeInTheDocument();
  });

  it('locks the password change when the API refuses it for a protected account', async () => {
    serve(testUser(), { '/api/me/password': () => protectedError });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Alterar senha');
    await user.type(drawer.getByLabelText('Senha atual'), 'senha-segura-123');
    await user.type(drawer.getByLabelText('Nova senha'), 'nova-senha-456');
    await user.type(drawer.getByLabelText('Confirmar nova senha'), 'nova-senha-456');
    await user.click(drawer.getByRole('button', { name: 'Alterar senha' }));

    expect(await screen.findByText(/conta de demonstração, compartilhada/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled();
  });
});
