import { screen, waitFor, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Role } from '@constants/areas';
import { holdRequests, mockApi, renderApp, requestBody, TEST_TOKEN, testUser } from '@/test/render-app';
import { EXAMPLE_ALL_PROFILES } from '@constants/example-accounts';

const renderAt = (path: string) => renderApp(path);

const session = (roles: Role[]) => ({
  token: TEST_TOKEN,
  expiresAt: '2026-11-20T12:00:00.000Z',
  user: testUser(roles),
});

describe('login', () => {
  it('sends the root address to the login screen', async () => {
    const { router } = renderAt('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
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

  it('shows the brand art, the sign-up link and the example accounts', async () => {
    renderAt('/login');

    expect(await screen.findByText('Sua saúde, seus horários, em um só lugar.')).toBeInTheDocument();
    expect(screen.getByText('Use seu e-mail e senha da clínica.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toHaveAttribute('href', '/cadastro');
    expect(screen.getByRole('link', { name: 'Esqueci a senha' })).toHaveAttribute('href', '/esqueci-senha');
    const examples = within(screen.getByRole('region', { name: 'Contas de exemplo' })).getAllByRole('button');
    expect(examples).toHaveLength(1);
    expect(examples[0]).toHaveTextContent('Conta completa');
    expect(examples[0]).toHaveTextContent('Paciente, médico e administrador');
    expect(examples[0]).toHaveAccessibleDescription('Preenche o e-mail e a senha da conta.');
  });

  it('fills in the example account, keeps the password hidden and marks it', async () => {
    const account = EXAMPLE_ALL_PROFILES;
    const { user } = renderAt('/login');

    const chip = await screen.findByRole('button', { name: /Conta completa/ });
    expect(chip).not.toHaveClass('bg-role-soft');
    await user.click(chip);

    expect(screen.getByLabelText('E-mail')).toHaveValue(account.email);
    expect(screen.getByLabelText('Senha')).toHaveValue(account.password);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(chip).toHaveClass('bg-role-soft');
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

    await waitFor(() =>
      expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toContain(
        'E-mail ou senha incorretos.',
      ),
    );
  });

  it('gives the form an accessible name', async () => {
    renderAt('/login');

    expect(await screen.findByRole('form', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'username');
  });

  it('ignores Enter while the login is running', async () => {
    const fetchMock = mockApi({ status: 200, body: session(['patient']) });
    const held = holdRequests(fetchMock, () => true);
    const { router, user } = renderAt('/login');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123{Enter}');
    await screen.findByRole('button', { name: 'Entrar, Carregando' });
    await user.type(screen.getByLabelText('Senha'), '{Enter}');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    held[0]?.release();
    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente'));
  });

  it('keeps the button busy while the request runs', async () => {
    const held = holdRequests(mockApi({ status: 200, body: session(['patient']) }), () => true);
    const { router, user } = renderAt('/login');

    await user.type(await screen.findByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: 'Entrar, Carregando' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    held[0]?.release();
    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente'));
  });
});

describe('register', () => {
  async function fillForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Nome completo'), 'Ana Maria Silva');
    await user.type(screen.getByLabelText('E-mail'), 'ana@email.com');
    await user.type(screen.getByLabelText(/Telefone/), '(11) 98765-4321');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-123');
    await user.type(screen.getByLabelText('Confirmar senha'), 'senha-segura-123');
    await user.click(screen.getByRole('checkbox'));
  }

  it('links to the terms and the privacy policy', async () => {
    renderAt('/cadastro');

    expect(await screen.findByRole('heading', { level: 1, name: 'Criar conta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    const terms = screen.getByRole('link', { name: /^termos de uso.*abre em nova aba/ });
    expect(terms).toHaveAttribute('href', '/termos');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /^política de privacidade.*abre em nova aba/ })).toHaveAttribute(
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

  it.each([
    ['a single emoji as the name', 'Nome completo', '😀', 'Informe seu nome completo (2 a 120 caracteres).'],
    [
      'a name with 121 characters',
      'Nome completo',
      'a'.repeat(121),
      'Informe seu nome completo (2 a 120 caracteres).',
    ],
    [
      'a control character in the name',
      'Nome completo',
      'Ana\u0007Silva',
      'O nome não pode ter caracteres de controle.',
    ],
    ['an invalid e-mail', 'E-mail', 'ana@', 'Informe um e-mail válido.'],
    [
      'an e-mail over 254 characters',
      'E-mail',
      `${'a'.repeat(250)}@email.com`,
      'O e-mail pode ter até 254 caracteres.',
    ],
    ['a phone starting with zero', /Telefone/, '011987654321', 'Informe um telefone válido com DDD.'],
    ['a password over 128 characters', 'Senha', 'a'.repeat(129), 'A senha pode ter até 128 caracteres.'],
  ])('rejects %s before calling the API', async (_case, label, value, message) => {
    const fetchMock = mockApi();
    const { user } = renderAt('/cadastro');

    await user.click(await screen.findByLabelText(label));
    await user.paste(value);
    await user.click(screen.getByRole('button', { name: 'Cadastrar-se' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts international phones the API accepts and sends an empty phone as empty', async () => {
    const fetchMock = mockApi({
      status: 201,
      body: { ...session(['patient']).user, email: 'ana@email.com' },
    });
    const { router, user } = renderAt('/cadastro');

    await fillForm(user);
    await user.clear(screen.getByLabelText(/Telefone/));
    await user.type(screen.getByLabelText(/Telefone/), '+44 20 7946 0958');
    await user.click(screen.getByRole('button', { name: 'Cadastrar-se' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(requestBody(fetchMock)).toMatchObject({ phone: '+44 20 7946 0958' });
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

  it('goes back to the sign-up when opened directly', async () => {
    const { router, user } = renderAt('/termos');

    await user.click(await screen.findByRole('link', { name: 'Voltar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'));
  });
});
