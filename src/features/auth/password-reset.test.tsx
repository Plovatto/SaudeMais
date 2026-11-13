import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { mockApi, mockFetch, renderApp, TEST_TOKEN } from '@/test/render-app';

const RESET_TOKEN = 'b'.repeat(43);

function body(fetchMock: ReturnType<typeof mockApi>, call = 0): unknown {
  return JSON.parse(fetchMock.mock.calls[call]?.[1]?.body as string);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forgot password', () => {
  it('always confirms the request with the same message', async () => {
    const fetchMock = mockApi({ status: 204 });
    const { user } = renderApp('/esqueci-senha');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText(/Se houver uma conta com o e-mail/)).toHaveAttribute('role', 'status');
    expect(screen.getByText('ana@email.com')).toBeInTheDocument();
    expect(body(fetchMock)).toEqual({ email: 'ana@email.com' });
  });

  it('validates the e-mail before calling the API', async () => {
    const fetchMock = mockApi();
    const { user } = renderApp('/esqueci-senha');

    await user.type(await screen.findByLabelText('E-mail'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains when too many links were requested', async () => {
    mockApi({
      status: 429,
      body: {
        message: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
        code: 'TOO_MANY_REQUESTS',
      },
    });
    const { user } = renderApp('/esqueci-senha');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    await waitFor(() =>
      expect(screen.getAllByRole('alert').some((element) => element.textContent?.trim())).toBe(true),
    );
    expect(screen.queryByText(/Se houver uma conta/)).not.toBeInTheDocument();
  });

  it('is reached from the login screen', async () => {
    const { router, user } = renderApp('/login');

    await user.click(await screen.findByRole('link', { name: 'Esqueceu a senha?' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/esqueci-senha'));
  });
});

describe('reset password', () => {
  const fill = async (user: ReturnType<typeof renderApp>['user'], confirmation = 'nova-senha-456') => {
    await user.type(await screen.findByLabelText('Nova senha'), 'nova-senha-456');
    await user.type(screen.getByLabelText('Confirmar nova senha'), confirmation);
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
  };

  it('removes the token from the address as soon as it is read', async () => {
    const { router } = renderApp(`/redefinir-senha#token=${RESET_TOKEN}`);

    expect(await screen.findByLabelText('Nova senha')).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.hash).toBe(''));
    expect(router.state.location.pathname).toBe('/redefinir-senha');
  });

  it('sets the new password and sends the person to the login', async () => {
    const fetchMock = mockApi({ status: 204 });
    const { router, user } = renderApp(`/redefinir-senha#token=${RESET_TOKEN}`);

    await fill(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('Senha redefinida. Entre com a nova senha.')).toBeInTheDocument();
    expect(body(fetchMock)).toEqual({
      token: RESET_TOKEN,
      password: 'nova-senha-456',
      passwordConfirmation: 'nova-senha-456',
    });
  });

  it('ends a session open in this browser, since the reset signs out everywhere', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    mockFetch((path) => (path === '/api/password-reset/confirm' ? { status: 204 } : undefined));
    const { router, user } = renderApp(`/redefinir-senha#token=${RESET_TOKEN}`);

    await fill(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('explains a used or expired link and offers a new one', async () => {
    mockApi({
      status: 400,
      body: {
        message: 'Este link é inválido ou já venceu. Peça um novo.',
        code: 'INVALID_RESET_TOKEN',
        fields: { token: 'Este link é inválido ou já venceu. Peça um novo.' },
      },
    });
    const { user } = renderApp(`/redefinir-senha#token=${RESET_TOKEN}`);

    await fill(user);

    expect(await screen.findByText(/Este link é inválido ou já venceu/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Peça um novo link' })).toHaveAttribute('href', '/esqueci-senha');
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it.each([
    ['without a token', '/redefinir-senha'],
    ['with a malformed token', '/redefinir-senha#token=curto'],
  ])('refuses a link %s', async (_case, path) => {
    renderApp(path);

    expect(await screen.findByRole('link', { name: 'Peça um novo link' })).toBeInTheDocument();
  });

  it('checks the confirmation before calling the API', async () => {
    const fetchMock = mockApi();
    const { user } = renderApp(`/redefinir-senha#token=${RESET_TOKEN}`);

    await fill(user, 'outra-senha-789');

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
