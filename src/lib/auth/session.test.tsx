import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('asks a visitor without a session to log in, without the expired notice', async () => {
    const { router } = renderApp('/medico/agenda');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?returnTo=%2Fmedico%2Fagenda');
    expect(screen.queryByText('Sua sessão expirou. Entre novamente.')).not.toBeInTheDocument();
  });
});

describe('route guards', () => {
  it('shows the 403 page for an area of another role', async () => {
    renderApp('/admin', { signedInAs: ['patient'] });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acesso negado' })).toBeInTheDocument();
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

describe('signing out across tabs', () => {
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

  it('ignores a late 401 after the session is already gone', () => {
    endSession('expired');

    expect(readToken()).toBeNull();
  });
});
