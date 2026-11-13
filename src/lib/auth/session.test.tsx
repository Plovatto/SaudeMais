import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@lib/api/api-error';
import { mockApi, mockFetch, renderApp, signIn, TEST_TOKEN, testUser } from '@/test/render-app';
import { homeFor, safeReturnTo } from './return-to';
import { endSession, startSession } from './session';
import { clearToken, readToken, saveToken, SESSION_STORAGE_KEY } from './token-store';

describe('token store', () => {
  it('keeps the token only for this tab unless asked to remember it', () => {
    saveToken('tab-token', false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe('tab-token');
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    saveToken('remembered', true);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe('remembered');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(readToken()).toBe('remembered');

    clearToken();
    expect(readToken()).toBeNull();
  });

  it('drops the remembered token when the next login is only for this tab', () => {
    saveToken('remembered', true);
    saveToken('tab-only', false);

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(readToken()).toBe('tab-only');
  });

  it('falls back to memory when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    saveToken('in-memory', true);

    expect(readToken()).toBe('in-memory');
    vi.restoreAllMocks();
  });
});

describe('return address', () => {
  it.each([
    ['/paciente/agendamentos', '/paciente/agendamentos'],
    ['/admin/usuarios?pagina=2', '/admin/usuarios?pagina=2'],
    ['//evil.example.com', null],
    ['https://evil.example.com', null],
    ['/\\evil.example.com', null],
    ['/login', null],
    ['/login?x=1', null],
    ['/cadastro', null],
    ['javascript:alert(1)', null],
    ['/paciente agendamentos', null],
    [' /paciente', null],
    [null, null],
  ])('accepts only paths inside the app (%s)', (value, expected) => {
    expect(safeReturnTo(value)).toBe(expected);
  });

  it('sends single-role accounts to their area and others to the role choice', () => {
    expect(homeFor(['patient'])).toBe('/paciente');
    expect(homeFor(['doctor', 'patient'])).toBe('/perfis');
    expect(homeFor(['patient'], '//evil.example.com')).toBe('/paciente');
  });
});

describe('session check', () => {
  it('shows the start screen while checking, then the area with the user name', async () => {
    const fetchMock = signIn(['patient']);
    renderApp('/paciente');

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    expect(await screen.findByText('Ana Maria Silva')).toBeInTheDocument();
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get('Authorization')).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it('sends an expired session to the login with a notice and the way back', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    mockFetch(() => ({ status: 401, body: { message: 'Sua sessão expirou.', code: 'UNAUTHENTICATED' } }));
    const { router } = renderApp('/paciente/agendamentos');

    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?returnTo=%2Fpaciente%2Fagendamentos');
    expect(readToken()).toBeNull();
  });

  it('keeps the session and offers a retry when the server cannot be reached', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    let online = false;
    mockFetch(() => (online ? { status: 200, body: testUser(['patient']) } : { status: 503 }));
    const { user } = renderApp('/paciente');

    await user.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    expect(readToken()).toBe(TEST_TOKEN);
    online = true;
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Ana Maria Silva')).toBeInTheDocument();
  });

  it('offers a retry when the network fails outright while checking', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    renderApp('/paciente');

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(readToken()).toBe(TEST_TOKEN);
  });

  it('clears the expiry notice from history once shown', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    mockFetch(() => ({ status: 401, body: { message: 'Sua sessão expirou.', code: 'UNAUTHENTICATED' } }));
    const { router } = renderApp('/paciente');

    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.state).toBeNull());
  });

  it('asks a visitor without a session to log in, without the expired notice', async () => {
    const { router } = renderApp('/medico/agenda');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?returnTo=%2Fmedico%2Fagenda');
    expect(screen.queryByText('Sua sessão expirou. Entre novamente.')).not.toBeInTheDocument();
  });
});

describe('route guards', () => {
  it('shows the 403 page for an area of another role, with its own title', async () => {
    renderApp('/admin', { signedInAs: ['patient'] });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acesso negado' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Acesso negado · Saúde+'));
  });

  it('sends a logged-in visitor away from the login', async () => {
    const { router } = renderApp('/login', { signedInAs: ['patient'] });

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente'));
  });

  it('returns to the requested page after logging in, but never to another site', async () => {
    mockApi({
      status: 200,
      body: { token: TEST_TOKEN, expiresAt: '2026-11-20T12:00:00.000Z', user: testUser() },
    });
    const { router, user } = renderApp('/login?returnTo=%2F%2Fevil.example.com');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente'));
  });

  it('remembers the session in the browser when asked', async () => {
    mockApi({
      status: 200,
      body: { token: TEST_TOKEN, expiresAt: '2026-11-20T12:00:00.000Z', user: testUser() },
    });
    const { router, user } = renderApp('/login?returnTo=%2Fpaciente%2Fperfil');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.click(screen.getByLabelText('Lembrar de mim'));
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/perfil'));
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe(TEST_TOKEN);
  });
});

describe('role choice', () => {
  it('lists only the roles of the account, in the app order', async () => {
    renderApp('/perfis', { signedInAs: ['doctor', 'patient'] });

    const links = within(await screen.findByRole('list')).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'PacienteAgendar consultas e gerenciar minha saúde',
      'MédicoGerenciar agenda e atender pacientes',
    ]);
  });

  it('explains when the account has no active role', async () => {
    renderApp('/perfis', { signedInAs: [] });

    expect(await screen.findByText('Nenhum perfil ativo')).toBeInTheDocument();
  });

  it('says that "Voltar" ends the session', async () => {
    renderApp('/perfis', { signedInAs: ['doctor', 'patient'] });

    expect(await screen.findByRole('button', { name: 'Voltar' })).toHaveAccessibleDescription(
      'Encerra a sessão e volta para o login.',
    );
  });

  it('skips the choice for patient-only accounts', async () => {
    const { router } = renderApp('/perfis', { signedInAs: ['patient'] });

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente'));
  });

  it('signs out with "Voltar"', async () => {
    const fetchMock = mockApi({ status: 204 });
    const { router, user } = renderApp('/perfis', { signedInAs: ['doctor', 'patient'] });

    await user.click(await screen.findByRole('button', { name: 'Voltar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3001/api/users/logout');
    expect(readToken()).toBeNull();
  });
});

describe('signing out', () => {
  it('leaves at once and tells the server afterwards, ignoring repeated clicks', async () => {
    let answer: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Promise<Response>((resolve) => {
          answer = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { router, user } = renderApp('/perfis', { signedInAs: ['doctor', 'patient'] });

    await user.click(await screen.findByRole('button', { name: 'Voltar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('');
    expect(readToken()).toBeNull();
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      `Bearer ${TEST_TOKEN}`,
    );
    answer(new Response(null, { status: 204 }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('cached data between sessions', () => {
  it('is cleared when the session expires', async () => {
    const { queryClient } = renderApp('/paciente', { signedInAs: ['patient'] });
    await screen.findByText('Ana Maria Silva');
    queryClient.setQueryData(['private'], 'dados de Ana');

    act(() => endSession('expired', TEST_TOKEN));

    expect(queryClient.getQueryData(['private'])).toBeUndefined();
  });

  it('is cleared when another account logs in on the same tab', async () => {
    const { queryClient } = renderApp('/paciente', { signedInAs: ['patient'] });
    await screen.findByText('Ana Maria Silva');
    queryClient.setQueryData(['private'], 'dados de Ana');

    act(() => startSession('B'.repeat(43), false));

    expect(queryClient.getQueryData(['private'])).toBeUndefined();
  });

  it('ends the session when any request answers 401 with the current token', async () => {
    const { router, queryClient } = renderApp('/paciente/agendamentos', { signedInAs: ['patient'] });
    await screen.findByText('Ana Maria Silva');
    const expiredError = Object.assign(new ApiError(401, 'UNAUTHENTICATED', ''), { token: TEST_TOKEN });

    await act(() =>
      queryClient
        .fetchQuery({ queryKey: ['private'], queryFn: () => Promise.reject(expiredError) })
        .catch(() => undefined),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?returnTo=%2Fpaciente%2Fagendamentos');
    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument();
  });

  it('ignores a late 401 from a previous session after a new login', () => {
    startSession(TEST_TOKEN, false);

    endSession('expired', 'O'.repeat(43));

    expect(readToken()).toBe(TEST_TOKEN);
  });
});

describe('signing out across tabs', () => {
  it('follows another tab to the login, without a way back, and drops cached data', async () => {
    const { router, queryClient } = renderApp('/paciente/agendamentos', { signedInAs: ['patient'] });
    await screen.findByText('Ana Maria Silva');
    queryClient.setQueryData(['private'], 'dados de Ana');
    const otherTab = new BroadcastChannel('saudemais:v1:session');

    otherTab.postMessage('signed-out');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('');
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    otherTab.close();
  });

  it('notices a remembered token removed by another tab', async () => {
    const { router } = renderApp('/paciente', { signedInAs: ['patient'] });
    await screen.findByText('Ana Maria Silva');
    sessionStorage.clear();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY }));
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('tells the other tabs and follows a sign-out made in another tab', async () => {
    const postMessage = vi.spyOn(BroadcastChannel.prototype, 'postMessage');
    startSession(TEST_TOKEN, false);

    endSession('signed-out');
    expect(postMessage).toHaveBeenCalledWith('signed-out');
    postMessage.mockRestore();

    startSession(TEST_TOKEN, true);
    const otherTab = new BroadcastChannel('saudemais:v1:session');
    otherTab.postMessage('signed-out');

    await waitFor(() => expect(readToken()).toBeNull());
    otherTab.close();
  });

  it('ignores a 401 after the session is already gone', () => {
    endSession('expired');

    expect(readToken()).toBeNull();
  });
});
