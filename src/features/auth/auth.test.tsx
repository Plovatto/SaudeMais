import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@app/routes';
import { ToastProvider } from '@components/ui';
import { DEMO_PATIENT } from './demo-accounts';

interface MockResponse {
  status: number;
  body?: unknown;
}

function mockApi(...responses: MockResponse[]) {
  const queue = [...responses];
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => {
    const next = queue.shift() ?? { status: 500 };
    await Promise.resolve();
    return new Response(next.body === undefined ? null : JSON.stringify(next.body), {
      status: next.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function requestBody(fetchMock: ReturnType<typeof mockApi>, call = 0): unknown {
  const init = fetchMock.mock.calls[call]?.[1];
  return JSON.parse(init?.body as string);
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return { router, user: userEvent.setup() };
}

const session = (roles: string[]) => ({
  token: 'A'.repeat(43),
  expiresAt: '2026-11-20T12:00:00.000Z',
  user: {
    id: '0190c2a0-0000-7000-8000-000000000000',
    fullName: 'Ana',
    email: 'ana@email.com',
    phone: null,
    roles,
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('login', () => {
  it('sends the root address to the login screen', async () => {
    const { router } = renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Saúde+' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('validates the fields before calling the API and focuses the first invalid one', async () => {
    const fetchMock = mockApi();
    const { user } = renderAt('/login');

    await user.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fills in the demo patient', async () => {
    const { user } = renderAt('/login');

    await user.click(await screen.findByRole('button', { name: /Preencher/ }));

    expect(screen.getByLabelText('E-mail')).toHaveValue(DEMO_PATIENT.email);
    expect(screen.getByLabelText('Senha')).toHaveValue(DEMO_PATIENT.password);
  });

  it('logs a patient in and opens the patient area', async () => {
    const fetchMock = mockApi({ status: 200, body: session(['patient']) });
    const { router, user } = renderAt('/login');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.click(screen.getByLabelText('Lembrar de mim'));
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente'));
    expect(requestBody(fetchMock)).toEqual({
      email: 'ana@email.com',
      password: 'senha-segura-123',
      remember: true,
    });
  });

  it('sends accounts with more than one role to the role choice', async () => {
    mockApi({ status: 200, body: session(['admin', 'patient']) });
    const { router, user } = renderAt('/login');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/perfis'));
  });

  it('shows the API message for wrong credentials', async () => {
    mockApi({ status: 401, body: { message: 'E-mail ou senha incorretos.', code: 'INVALID_CREDENTIALS' } });
    const { user } = renderAt('/login');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
  });

  it('keeps the button busy while the request runs', async () => {
    let release: () => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            release = () => resolve(new Response(JSON.stringify(session(['patient'])), { status: 200 }));
          }),
      ),
    );
    const { user } = renderAt('/login');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: 'Entrar, Carregando' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    release();
  });
});

describe('register', () => {
  async function fillForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Nome completo'), 'Ana Maria Silva');
    await user.type(screen.getByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Telefone'), '(11) 98765-4321');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.type(screen.getByLabelText('Confirmar senha'), 'senha-segura-123');
    await user.click(screen.getByRole('checkbox'));
  }

  it('shows the demo environment notice and links to the terms and the privacy policy', async () => {
    renderAt('/cadastro');

    expect(await screen.findByRole('note')).toHaveTextContent('Ambiente de demonstração');
    expect(screen.getByRole('link', { name: 'termos de uso' })).toHaveAttribute('href', '/termos');
    expect(screen.getByRole('link', { name: 'política de privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
  });

  it('checks the confirmation and the terms', async () => {
    const fetchMock = mockApi();
    const { user } = renderAt('/cadastro');

    await user.type(await screen.findByLabelText('Senha'), 'senha-segura-123');
    await user.type(screen.getByLabelText('Confirmar senha'), 'outra-senha-123');
    await user.click(screen.getByRole('button', { name: 'Cadastrar-se' }));

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument();
    expect(
      screen.getByText('É preciso aceitar os termos de uso e a política de privacidade.'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates the account and opens the login with the e-mail filled in', async () => {
    const fetchMock = mockApi({
      status: 201,
      body: { ...session(['patient']).user, email: 'ana@email.com' },
    });
    const { router, user } = renderAt('/cadastro');

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar-se' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByLabelText('E-mail')).toHaveValue('ana@email.com');
    expect(screen.getByRole('status')).toHaveTextContent('Conta criada');
    expect(requestBody(fetchMock)).toMatchObject({ fullName: 'Ana Maria Silva', acceptTerms: true });
  });

  it('puts an API field error on the right field', async () => {
    mockApi({
      status: 409,
      body: {
        message: 'Este e-mail já está cadastrado.',
        code: 'EMAIL_TAKEN',
        fields: { email: 'Este e-mail já está cadastrado.' },
      },
    });
    const { user } = renderAt('/cadastro');

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar-se' }));

    await waitFor(() =>
      expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Este e-mail já está cadastrado.'),
    );
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
    expect(screen.queryAllByRole('alert').filter((alert) => alert.textContent)).toEqual([]);
  });
});

describe('legal pages', () => {
  it.each([
    ['/termos', 'Termos de uso'],
    ['/privacidade', 'Política de privacidade'],
  ])('shows %s with its version', async (path, title) => {
    renderAt(path);

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(/Versão de 13 de novembro de 2026/)).toBeInTheDocument();
  });
});
