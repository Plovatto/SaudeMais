import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { THEME_STORAGE_KEY } from '@lib/theme';
import { passwordSchema } from './profile-schemas';
import {
  holdRequests,
  renderApp,
  serveApi,
  TEST_TOKEN,
  testUser,
  type MockResponse,
} from '@/test/render-app';

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

const defaults: Record<string, MockResponse> = {
  '/api/me/sessions': { status: 200, body: sessionsList },
  '/api/me/email-preferences': { status: 200, body: preferences },
};

function serve(user: ServedUser, routes: Record<string, Route> = {}) {
  const paths = new Set([...Object.keys(defaults), ...Object.keys(routes)]);
  const served = [...paths].map((path) => {
    const route: Route = (method, body) =>
      routes[path]?.(method, body) ?? (method === 'GET' ? defaults[path] : undefined);
    return [path, route] as const;
  });
  return serveApi(user.roles, Object.fromEntries(served), user).fetchMock;
}

const openProfile = (base = '/paciente') => renderApp(`${base}/perfil`);

type User = ReturnType<typeof openProfile>['user'];

async function openDrawer(user: User, opener: string) {
  await user.click(await screen.findByRole('button', { name: opener }));
  return within(await screen.findByRole('dialog'));
}

const holdPatches = (fetchMock: ReturnType<typeof serve>) =>
  holdRequests(fetchMock, (path, method) => path === '/api/me/email-preferences' && method === 'PATCH');

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
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
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', base);
  });

  it('shows the birth date and age only in the patient area', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-17T12:00:00.000Z') });
    serve({ ...testUser(['patient', 'doctor']), birthDate: '1986-03-12' });
    openProfile();

    expect(await screen.findByText('12/03/1986 · 40 anos')).toBeInTheDocument();
    expect(screen.getByText('40 anos')).toBeInTheDocument();
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

  it('keeps the edit drawer open while the changes are being saved', async () => {
    const fetchMock = serve(testUser());
    const held = holdRequests(fetchMock, (path, method) => path === '/api/me' && method === 'PATCH');
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    const name = drawer.getByLabelText('Nome completo');
    await user.clear(name);
    await user.type(name, 'Ana Souza');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(drawer.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument());
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Editar perfil' })).toBeInTheDocument();

    held[0]?.respond(200, { ...testUser(), fullName: 'Ana Souza' });
    expect(await screen.findByText('Dados atualizados.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
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

  it('refuses an incomplete birth date instead of removing it', async () => {
    const patch = vi.fn(() => undefined);
    serve({ ...testUser(), birthDate: '1986-03-12' }, { '/api/me': patch });
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Editar perfil');
    Object.defineProperty(drawer.getByLabelText('Data de nascimento'), 'validity', {
      value: { badInput: true },
    });
    await user.type(drawer.getByLabelText('Nome completo'), ' Souza');
    await user.click(drawer.getByRole('button', { name: 'Salvar alterações' }));

    expect(
      await drawer.findByText('Complete a data de nascimento ou deixe o campo em branco.'),
    ).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalledWith('PATCH', expect.anything());
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

describe('leaving the account', () => {
  it('signs out only once when the confirmation is clicked twice', async () => {
    const logout = vi.fn(() => ({ status: 204 }));
    serve(testUser(), { '/api/users/logout': logout });
    const { router, user } = openProfile();

    const dialog = await openDrawer(user, 'Sair da conta');
    await user.dblClick(dialog.getByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(logout).toHaveBeenCalledOnce();
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

describe('appearance without storage', () => {
  it('keeps the choice in sync when storage rejects writes', async () => {
    serve(testUser());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { user } = openProfile();

    await user.click(await screen.findByRole('radio', { name: 'Escuro' }));

    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Claro' })).not.toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Sistema' }));
    localStorage.clear();
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked();
  });
});

describe('email preferences', () => {
  it('lists the topics and saves a change', async () => {
    let server = preferences.map((item) => ({ ...item }));
    const patch = vi.fn((method: string) => {
      if (method === 'GET') return { status: 200, body: server };
      server = server.map((item) => ({ ...item, enabled: true }));
      return { status: 200, body: server };
    });
    serve(testUser(), { '/api/me/email-preferences': patch });
    const { user } = openProfile();

    expect(await screen.findByRole('switch', { name: 'Lembrete por e-mail' })).toBeChecked();
    const result = screen.getByRole('switch', { name: 'Resultado disponível' });
    expect(result).not.toBeChecked();

    await user.click(result);

    expect(patch).toHaveBeenCalledWith('PATCH', { preferences: [{ topic: 'exam_result', enabled: true }] });
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked());
  });

  it('rolls back only the failed switch when two changes are in flight', async () => {
    let server = preferences.map((item) => ({ ...item }));
    const fetchMock = serve(testUser(), {
      '/api/me/email-preferences': (method) => (method === 'GET' ? { status: 200, body: server } : undefined),
    });
    const held = holdPatches(fetchMock);
    const { user } = openProfile();

    await user.click(await screen.findByRole('switch', { name: 'Lembrete por e-mail' }));
    await user.click(screen.getByRole('switch', { name: 'Resultado disponível' }));
    await waitFor(() => expect(held).toHaveLength(2));
    expect(screen.getByRole('switch', { name: 'Lembrete por e-mail' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked();

    held[0]?.respond(500, { message: 'Erro', code: 'INTERNAL_ERROR' });
    expect(await screen.findByText('Algo deu errado. Tente de novo em instantes.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Lembrete por e-mail' })).toBeChecked());
    expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked();

    server = server.map((item) => (item.topic === 'exam_result' ? { ...item, enabled: true } : item));
    held[1]?.respond(200, server);
    await waitFor(() => expect(held).toHaveLength(2));
    expect(screen.getByRole('switch', { name: 'Lembrete por e-mail' })).toBeChecked();
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked());
  });

  it('keeps the latest choices when the responses arrive out of order', async () => {
    let server = preferences.map((item) => ({ ...item }));
    const fetchMock = serve(testUser(), {
      '/api/me/email-preferences': (method) => (method === 'GET' ? { status: 200, body: server } : undefined),
    });
    const held = holdPatches(fetchMock);
    const { user } = openProfile();

    await user.click(await screen.findByRole('switch', { name: 'Resultado disponível' }));
    await user.click(screen.getByRole('switch', { name: 'Lembrete por e-mail' }));
    await waitFor(() => expect(held).toHaveLength(2));

    server = server.map((item) => ({ ...item, enabled: item.topic === 'exam_result' }));
    held[1]?.respond(200, server);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked());
    expect(screen.getByRole('switch', { name: 'Lembrete por e-mail' })).not.toBeChecked();

    held[0]?.respond(200, server);
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Lembrete por e-mail' })).not.toBeChecked(),
    );
    expect(screen.getByRole('switch', { name: 'Resultado disponível' })).toBeChecked();
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
    serve({ ...testUser(), passwordChangedAt: new Date(Date.now() - 100 * 86_400_000).toISOString() });
    openProfile();

    expect(await screen.findByText('Última alteração há 3 meses')).toBeInTheDocument();
  });

  it('keeps the button disabled until every rule passes', async () => {
    serve(testUser());
    const { user } = openProfile();

    const drawer = await openDrawer(user, 'Alterar senha');
    const save = drawer.getByRole('button', { name: 'Alterar senha' });
    const typeNew = async (value: string) => {
      const password = drawer.getByLabelText('Nova senha', { exact: true });
      const confirmation = drawer.getByLabelText('Confirmar nova senha');
      await user.clear(password);
      await user.clear(confirmation);
      await user.type(password, value);
      await user.type(confirmation, value);
    };
    await user.type(drawer.getByLabelText('Senha atual'), 'senha1234');
    expect(save).toBeDisabled();

    await typeNew('abcdefgh');
    expect(drawer.getByText('Letras e números')).toHaveTextContent('pendente');
    expect(save).toBeDisabled();

    await typeNew('senha1234');
    expect(drawer.getByText('Diferente da senha atual')).toHaveTextContent('pendente');
    expect(save).toBeDisabled();

    await typeNew('nova1234');
    expect(save).toBeEnabled();
    expect(drawer.getAllByText('Pelo menos 8 caracteres')).toHaveLength(1);
  });

  it('explains the rules the new password breaks', () => {
    const base = { currentPassword: 'senha1234', passwordConfirmation: 'abcdefgh' };
    const message = (password: string, confirmation = password) => {
      const result = passwordSchema.safeParse({ ...base, password, passwordConfirmation: confirmation });
      return result.success ? null : result.error.issues[0]?.message;
    };

    expect(message('abcdefgh')).toBe('A senha precisa ter letras e números.');
    expect(message('senha1234')).toBe('A nova senha precisa ser diferente da atual.');
    expect(message('nova1234')).toBeNull();
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

  it('keeps the drawer open while the password is being changed', async () => {
    const fetchMock = serve(testUser());
    const held = holdRequests(fetchMock, (path) => path === '/api/me/password');
    const { user } = openProfile();

    const drawer = await fill(user);

    await waitFor(() => expect(drawer.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument());
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Alterar senha' })).toBeInTheDocument();

    held[0]?.respond(204);
    expect(
      await screen.findByText('Senha alterada. As outras sessões foram encerradas.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('changes the password, closes the drawer and refreshes the sessions', async () => {
    const fetchMock = serve(testUser(), { '/api/me/password': () => ({ status: 204 }) });
    const { user } = openProfile();

    await fill(user);

    expect(
      await screen.findByText('Senha alterada. As outras sessões foram encerradas.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
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

  it('treats a session that is already gone as ended', async () => {
    serve(testUser(), {
      '/api/me/sessions/s2': () => ({ status: 404, body: { message: 'Não encontrado.', code: 'NOT_FOUND' } }),
    });
    const { user } = openProfile();

    await user.click(
      await screen.findByRole('button', { name: 'Encerrar sessão: Dispositivo desconhecido' }),
    );

    expect(await screen.findByText('Sessão encerrada.')).toBeInTheDocument();
  });

  it('blocks the other rows while one session is being ended', async () => {
    const sessions = [
      ...sessionsList,
      { ...sessionsList[1], id: 's3', userAgent: 'Mozilla/5.0 (Macintosh) Firefox/140.0' },
    ];
    const fetchMock = serve(testUser(), {
      '/api/me/sessions': (method) => (method === 'GET' ? { status: 200, body: sessions } : undefined),
    });
    const held = holdRequests(
      fetchMock,
      (path, method) => path === '/api/me/sessions/s2' && method === 'DELETE',
    );
    const { user } = openProfile();

    await user.click(
      await screen.findByRole('button', { name: 'Encerrar sessão: Dispositivo desconhecido' }),
    );
    await waitFor(() => expect(held).toHaveLength(1));

    expect(screen.getByRole('button', { name: 'Encerrar sessão: Firefox no macOS' })).toBeDisabled();
    held[0]?.respond(204);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Encerrar sessão: Firefox no macOS' })).toBeEnabled(),
    );
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
