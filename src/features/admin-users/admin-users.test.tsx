import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DESKTOP_QUERY } from '@hooks/useMediaQuery';
import { SHEET_QUERY } from '@hooks/useSheetDrag';
import { SESSION_STORAGE_KEY } from '@lib/auth/token-store';
import { stubMatchMedia } from '@/test/match-media';
import { mockFetch, renderApp, serveApi, TEST_TOKEN, testUser, type ApiRoute } from '@/test/render-app';
import type { AdminUser } from './users-api';

const SELF_ID = testUser().id;

const person = (id: string, fullName: string, overrides: Partial<AdminUser> = {}): AdminUser => ({
  id,
  fullName,
  email: `${id}@email.com`,
  phone: null,
  roles: ['patient'],
  deactivatedAt: null,
  createdAt: '2026-11-01T12:00:00.000Z',
  ...overrides,
});

const joao = person('joao', 'João Silveira', { roles: ['patient', 'doctor'] });
const ana = person('ana', 'Ana Ferreira', { phone: '+5511987654321' });
const me = person(SELF_ID, 'Ana Maria Silva', { roles: ['patient', 'admin'] });
const bia = person('bia', 'Bia Admin', { roles: ['patient', 'admin'] });

const cardiology = { specialtyId: 'cardio', specialtyName: 'Cardiologia', council: 'CRM' };
const detail = (user: AdminUser, doctorProfile: Record<string, unknown> | null = null) => ({
  ...user,
  doctorProfile,
});
const joaoProfile = {
  ...cardiology,
  unitId: 'central',
  unitName: 'Unidade Central',
  registryNumber: '123456',
  registryUf: 'SP',
};

const specialties = [
  { id: 'cardio', name: 'Cardiologia', council: 'CRM', appointmentDurationMin: 30, isActive: true },
  { id: 'nutri', name: 'Nutrição', council: 'CRN', appointmentDurationMin: 30, isActive: true },
  { id: 'old', name: 'Antiga', council: 'CRM', appointmentDurationMin: 30, isActive: false },
];
const unit = (id: string, name: string) => ({
  id,
  name,
  address: 'Rua A, 1',
  phone: '+551133334444',
  isActive: true,
  hours: [],
});
const units = [unit('central', 'Unidade Central'), unit('norte', 'Unidade Norte')];
const catalog: Record<string, ApiRoute> = {
  '/api/specialties': () => ok(specialties),
  '/api/units': () => ok(units),
};

const page = (items: unknown[], total = items.length) => ({ items, page: 1, pageSize: 20, total });
const ok = (body: unknown, status = 200) => ({ status, body });
const conflict = (code: string, fields?: Record<string, string>, status = 409) => ({
  status,
  body: { code, message: 'Conflito.', ...(fields && { fields }) },
});

const serve = (routes: Record<string, ApiRoute>) => serveApi(['admin'], routes);
const holdSpecialties = ({ fetchMock }: ReturnType<typeof serve>) => {
  const respond = fetchMock.getMockImplementation();
  fetchMock.mockImplementation((url, init) => {
    const path = new URL(url instanceof Request ? url.url : url).pathname;
    return path === '/api/specialties' || !respond
      ? new Promise<Response>(() => undefined)
      : respond(url, init);
  });
};
const listOf =
  (...items: unknown[]): ApiRoute =>
  () =>
    ok(page(items, 45));

const desktop = () => stubMatchMedia((query) => query === DESKTOP_QUERY);
const phone = () => {
  stubMatchMedia((query) => query === SHEET_QUERY);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = () => undefined;
      disconnect = () => undefined;
    },
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const rowOf = (name: string) => screen.findByRole('button', { name: new RegExp(`^${name}`) });
const panel = (name: string) => screen.findByRole('dialog', { name });
const searchOf = (router: ReturnType<typeof renderApp>['router']) =>
  Object.fromEntries(new URLSearchParams(router.state.location.search));

describe('admin users list', () => {
  it('lists the accounts with initials, e-mail, profile and status', async () => {
    serve({ '/api/admin/users': listOf(joao, ana, me, { ...bia, deactivatedAt: '2026-11-10T12:00:00Z' }) });
    renderApp('/admin/usuarios');

    const list = await screen.findByRole('region', { name: 'Lista de usuários' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('45 usuários encontrados')).toBeInTheDocument();
    const doctor = await rowOf('João Silveira');
    expect(doctor).toHaveTextContent('JS');
    expect(doctor).toHaveTextContent('joao@email.com');
    expect(within(doctor).getByText('Médico')).toBeInTheDocument();
    expect(within(doctor).queryByText('Paciente')).not.toBeInTheDocument();
    expect(within(doctor).getByText('Ativo')).toBeInTheDocument();
    expect(within(await rowOf('Ana Ferreira')).getByText('Paciente')).toBeInTheDocument();
    expect(
      within(await rowOf('Ana Maria Silva')).getByText(`Você · ${SELF_ID}@email.com`),
    ).toBeInTheDocument();
    const inactive = await rowOf('Bia Admin');
    expect(within(inactive).getByText('Administrador')).toBeInTheDocument();
    expect(within(inactive).getByText('Inativo')).toBeInTheDocument();
    expect(within(inactive).getByText('BA')).not.toHaveClass('opacity-60');
    expect(within(inactive).getByText('BA')).toHaveClass('text-text-secondary');
  });

  it('filters by role tab, search, status and page through the URL and the request', async () => {
    const { calls } = serve({ '/api/admin/users': listOf(joao, ana) });
    const { user, router } = renderApp('/admin/usuarios?pagina=2');
    const lastQuery = () =>
      calls.filter((call) => call.url.pathname === '/api/admin/users').at(-1)?.url.searchParams;

    await rowOf('João Silveira');
    expect(lastQuery()?.get('page')).toBe('2');
    expect(screen.getAllByRole('tab', { name: /./ }).map((tab) => tab.textContent)).toEqual([
      'Todos',
      'Pacientes',
      'Médicos',
      'Administradores',
    ]);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar usuários' }), ' ana ');
    await waitFor(() => expect(lastQuery()?.get('search')).toBe('ana'));
    expect(lastQuery()?.get('page')).toBe('1');

    await user.click(screen.getByRole('tab', { name: 'Administradores' }));
    await waitFor(() => expect(lastQuery()?.get('role')).toBe('admin'));
    expect(screen.getByRole('tab', { name: 'Administradores' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Médicos' }));
    await waitFor(() => expect(lastQuery()?.get('role')).toBe('doctor'));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'inativos');
    await waitFor(() => expect(lastQuery()?.get('status')).toBe('inactive'));

    await user.click(screen.getByRole('button', { name: 'Página 3' }));
    await waitFor(() => expect(lastQuery()?.get('page')).toBe('3'));
    expect(searchOf(router)).toEqual({ busca: 'ana', perfil: 'medicos', situacao: 'inativos', pagina: '3' });
  });

  it('opens the patients tab from the URL', async () => {
    const { calls } = serve({ '/api/admin/users': listOf(ana) });
    renderApp('/admin/usuarios?perfil=pacientes');

    await rowOf('Ana Ferreira');
    expect(screen.getByRole('tab', { name: 'Pacientes' })).toHaveAttribute('aria-selected', 'true');
    expect(calls.at(-1)?.url.searchParams.get('role')).toBe('patient');
  });

  it('follows the search in the URL when the history changes', async () => {
    serve({ '/api/admin/users': listOf(joao) });
    const { user, router } = renderApp('/admin/usuarios');
    const search = await screen.findByRole('searchbox', { name: 'Buscar usuários' });

    await user.type(search, 'ana');
    await waitFor(() => expect(router.state.location.search).toBe('?busca=ana'));
    await act(() => router.navigate('/admin/usuarios'));

    expect(search).toHaveValue('');
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    expect(router.state.location.search).toBe('');

    await act(() => router.navigate(-1));
    expect(search).toHaveValue('ana');
  });

  it('ignores unknown filters and brings a page past the end back to the last one', async () => {
    const { calls } = serve({ '/api/admin/users': listOf(joao) });
    const { router } = renderApp('/admin/usuarios?perfil=x&situacao=y&pagina=999');
    const lastQuery = () =>
      calls.filter((call) => call.url.pathname === '/api/admin/users').at(-1)?.url.searchParams;

    await waitFor(() => expect(lastQuery()?.get('page')).toBe('3'));
    expect(lastQuery()?.has('role')).toBe(false);
    expect(lastQuery()?.has('status')).toBe(false);
    expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('combobox', { name: 'Situação' })).toHaveValue('todos');
    expect(new URLSearchParams(router.state.location.search).get('pagina')).toBe('3');
  });

  it('leaves the admin area when the account loses the administrator profile', async () => {
    let roles = ['admin'];
    sessionStorage.setItem(SESSION_STORAGE_KEY, TEST_TOKEN);
    mockFetch((path) => {
      if (path === '/api/me') return ok({ ...testUser(), roles });
      roles = ['patient'];
      return { status: 403, body: { code: 'FORBIDDEN', message: 'Sem acesso.' } };
    });
    renderApp('/admin/usuarios');

    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });

  it('tells when no account matches the filters', async () => {
    serve({ '/api/admin/users': () => ok(page([])) });
    renderApp('/admin/usuarios?busca=zzz');

    expect(await screen.findByText('Ninguém encontrado')).toBeInTheDocument();
    expect(screen.getByText('Tente outro nome, e-mail ou filtro.')).toBeInTheDocument();
  });
});

describe('user panel', () => {
  it('opens the user in a side panel on desktop and gives the focus back when it closes', async () => {
    desktop();
    serve({ '/api/admin/users': listOf(ana), '/api/admin/users/ana': () => ok(detail(ana)) });
    const { user, router } = renderApp('/admin/usuarios');

    const row = await rowOf('Ana Ferreira');
    expect(row).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(row);

    const dialog = await panel('Editar usuário');
    expect(searchOf(router)).toEqual({ usuario: 'ana' });
    expect(await within(dialog).findByRole('textbox', { name: 'Nome completo' })).toHaveValue('Ana Ferreira');
    expect(within(dialog).queryByRole('separator')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Editar usuário' })).not.toBeInTheDocument(),
    );
    expect(row).toHaveFocus();
  });

  it('opens the user in a bottom sheet on a phone', async () => {
    phone();
    serve({ '/api/admin/users': listOf(ana), '/api/admin/users/ana': () => ok(detail(ana)) });
    const { user } = renderApp('/admin/usuarios');

    await user.click(await rowOf('Ana Ferreira'));

    const dialog = await panel('Editar usuário');
    expect(
      within(dialog).getByRole('separator', { name: 'Arraste para ajustar a altura' }),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Editar usuário' })).not.toBeInTheDocument(),
    );
  });

  it.each([
    ['/admin/usuarios/ana', { usuario: 'ana' }, 'Editar usuário'],
    ['/admin/usuarios/ana/medico', { usuario: 'ana', secao: 'medico' }, 'Tornar médico'],
  ])('keeps the old link %s opening the panel', async (path, search, title) => {
    serve({ ...catalog, '/api/admin/users': listOf(ana), '/api/admin/users/ana': () => ok(detail(ana)) });
    const { router } = renderApp(path);

    expect(await panel(title)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/usuarios');
    expect(searchOf(router)).toEqual(search);
  });

  it('tells when the account no longer exists', async () => {
    serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/gone': () => ({ status: 404, body: { code: 'NOT_FOUND', message: 'x' } }),
    });
    renderApp('/admin/usuarios?usuario=gone');

    const dialog = await panel('Editar usuário');
    expect(
      await within(dialog).findByText('Este usuário não existe mais. Volte para a lista.'),
    ).toBeInTheDocument();
  });
});

describe('edit user', () => {
  it('saves name and phone with the e-mail read-only and closes the panel', async () => {
    const patch = vi.fn();
    const { calls } = serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': (method, body) => {
        if (method !== 'PATCH') return ok(detail(ana));
        patch(body);
        return ok(detail({ ...ana, fullName: 'Ana F. Souza', phone: null }));
      },
    });
    const { user, router } = renderApp('/admin/usuarios?usuario=ana');
    const lists = () => calls.filter((call) => call.url.pathname === '/api/admin/users').length;

    const dialog = await panel('Editar usuário');
    const name = await within(dialog).findByRole('textbox', { name: 'Nome completo' });
    expect(within(dialog).getByRole('textbox', { name: 'E-mail' })).toHaveAttribute('readonly');
    expect(within(dialog).getByRole('textbox', { name: /Telefone/ })).toHaveValue('(11) 98765-4321');
    expect(within(dialog).queryByLabelText(/senha/i, { selector: 'input' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();

    await user.clear(name);
    await user.type(name, 'Ana F. Souza');
    await user.clear(within(dialog).getByRole('textbox', { name: /Telefone/ }));
    const before = lists();
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Usuário atualizado.')).toBeInTheDocument();
    expect(patch).toHaveBeenCalledWith({ fullName: 'Ana F. Souza', phone: null });
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(lists()).toBeGreaterThan(before));
  });

  it('keeps the panel open while the changes are saved', async () => {
    const { fetchMock } = serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
    });
    const { user, router } = renderApp('/admin/usuarios?usuario=ana');

    const dialog = await panel('Editar usuário');
    await user.type(await within(dialog).findByRole('textbox', { name: 'Nome completo' }), ' Souza');
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeDisabled());
    expect(within(dialog).queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
    act(() => {
      (dialog as HTMLDialogElement).close();
    });
    expect(dialog).toHaveAttribute('open');
    expect(searchOf(router)).toEqual({ usuario: 'ana' });
  });

  it('shows the API error next to the field', async () => {
    serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': (method) =>
        method === 'PATCH'
          ? conflict('VALIDATION_ERROR', { fullName: 'Nome recusado pela API.' }, 400)
          : ok(detail(ana)),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana');

    const dialog = await panel('Editar usuário');
    const name = await within(dialog).findByRole('textbox', { name: 'Nome completo' });
    await user.type(name, ' Souza');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(await within(dialog).findByText('Nome recusado pela API.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
  });

  it('refreshes the session after editing the own account', async () => {
    const { fetchMock } = serve({
      '/api/admin/users': listOf(me),
      [`/api/admin/users/${SELF_ID}`]: (method) =>
        ok(detail(method === 'PATCH' ? { ...me, fullName: 'Ana M. Silva' } : me)),
    });
    const { user } = renderApp(`/admin/usuarios?usuario=${SELF_ID}`);
    const sessionLoads = () =>
      fetchMock.mock.calls.filter(([url]) => (url as string).endsWith('/api/me')).length;

    const name = await screen.findByRole('textbox', { name: 'Nome completo' });
    const before = sessionLoads();
    await user.clear(name);
    await user.type(name, 'Ana M. Silva');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Usuário atualizado.')).toBeInTheDocument();
    await waitFor(() => expect(sessionLoads()).toBeGreaterThan(before));
  });

  it('sends a password reset link and explains when it cannot be sent now', async () => {
    let attempts = 0;
    serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
      '/api/admin/users/ana/password-reset': () =>
        attempts++ === 0 ? { status: 202 } : conflict('RESET_NOT_SENT'),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana');

    const send = await screen.findByRole('button', { name: 'Enviar link de redefinição' });
    await user.click(send);
    expect(await screen.findByText('Link de redefinição enviado para ana@email.com.')).toBeInTheDocument();

    await user.click(send);
    expect(await screen.findByText(/Um link foi enviado há pouco/)).toBeInTheDocument();
  });

  it('shows the doctor profile and reactivates an inactive account', async () => {
    const inactive = { ...joao, deactivatedAt: '2026-11-10T12:00:00Z' };
    serve({
      '/api/admin/users': listOf(inactive),
      '/api/admin/users/joao': () => ok(detail(inactive, joaoProfile)),
      '/api/admin/users/joao/reactivate': () => ok(detail(joao, joaoProfile)),
    });
    const { user } = renderApp('/admin/usuarios?usuario=joao');

    const dialog = await panel('Editar usuário');
    expect(await within(dialog).findByText('CRM 123456/SP')).toBeInTheDocument();
    expect(within(dialog).getByText('Médico · Cardiologia')).toBeInTheDocument();
    expect(within(dialog).getByRole('note')).toHaveTextContent('Esta conta está desativada');
    expect(within(dialog).getByRole('button', { name: 'Enviar link de redefinição' })).toBeDisabled();
    const access = within(dialog).getByRole('switch', { name: 'Acesso ativo' });
    expect(access).not.toBeChecked();

    await user.click(access);

    expect(await screen.findByText('Conta de João Silveira reativada.')).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).queryByRole('note')).not.toBeInTheDocument());
    expect(access).toBeChecked();
  });

  it('confirms a deactivation with the bookings that will be cancelled', async () => {
    const { calls } = serve({
      '/api/admin/users': listOf(joao),
      '/api/admin/users/joao': () => ok(detail(joao, joaoProfile)),
      '/api/admin/users/joao/deactivation-impact': () =>
        ok({ futureAppointmentsAsPatient: 2, futureAppointmentsAsDoctor: 1 }),
      '/api/admin/users/joao/deactivate': () =>
        ok(detail({ ...joao, deactivatedAt: '2026-11-13T12:00:00Z' }, joaoProfile)),
    });
    const { user } = renderApp('/admin/usuarios?usuario=joao');

    await user.click(await screen.findByRole('switch', { name: 'Acesso ativo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Desativar a conta de João Silveira?' });
    expect(
      await within(dialog).findByText(
        /Serão cancelados: 2 agendamentos futuros como paciente e 1 consulta futura/,
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }));

    expect(await screen.findByText('Conta de João Silveira desativada.')).toBeInTheDocument();
    expect(
      calls.some((call) => call.method === 'POST' && call.url.pathname.endsWith('/joao/deactivate')),
    ).toBe(true);
    expect(await screen.findByRole('note')).toHaveTextContent('Esta conta está desativada');
  });

  it('explains when the last administrator would be lost', async () => {
    serve({
      '/api/admin/users': listOf(bia),
      '/api/admin/users/bia': () => ok(detail(bia)),
      '/api/admin/users/bia/roles/admin': (method) =>
        method === 'DELETE' ? conflict('SELF_OR_LAST_ADMIN') : undefined,
    });
    const { user } = renderApp('/admin/usuarios?usuario=bia');

    await user.click(await screen.findByRole('button', { name: 'Remover admin' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: /Remover o perfil de administrador/ })).getByRole(
        'button',
        { name: 'Remover admin' },
      ),
    );

    expect(await screen.findByText(/pelo menos um administrador ativo/)).toBeInTheDocument();
  });

  it('grants the administrator profile after confirming', async () => {
    const { calls } = serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
      '/api/admin/users/ana/roles/admin': () => ok(detail({ ...ana, roles: ['patient', 'admin'] })),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana');

    await user.click(await screen.findByRole('button', { name: 'Tornar admin' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: /Dar perfil de administrador/ })).getByRole('button', {
        name: 'Tornar admin',
      }),
    );

    expect(await screen.findByText('Ana Ferreira agora tem perfil de administrador.')).toBeInTheDocument();
    expect(calls.find((call) => call.url.pathname === '/api/admin/users/ana/roles/admin')?.method).toBe(
      'POST',
    );
    expect(await screen.findByRole('button', { name: 'Remover admin' })).toBeInTheDocument();
  });

  it('shows only the pending action as busy', async () => {
    const { fetchMock } = serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana');

    await user.click(await screen.findByRole('button', { name: 'Tornar admin' }));
    const confirm = await screen.findByRole('dialog', { name: /Dar perfil de administrador/ });
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));
    await user.click(within(confirm).getByRole('button', { name: 'Tornar admin' }));

    const panelDialog = await panel('Editar usuário');
    await waitFor(() =>
      expect(within(panelDialog).getByRole('button', { name: /^Tornar admin/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    expect(within(panelDialog).getByRole('switch', { name: 'Acesso ativo' })).not.toHaveAttribute(
      'aria-busy',
    );
  });

  it('disables changes that would lock the own account out', async () => {
    serve({
      '/api/admin/users': listOf(me),
      [`/api/admin/users/${SELF_ID}`]: () => ok(detail(me)),
    });
    renderApp(`/admin/usuarios?usuario=${SELF_ID}`);

    const access = await screen.findByRole('switch', { name: 'Acesso ativo' });
    expect(access).toBeDisabled();
    expect(access).toHaveAccessibleDescription('Você não pode desativar a própria conta.');
    const revoke = screen.getByRole('button', { name: 'Remover admin' });
    expect(revoke).toBeDisabled();
    expect(revoke).toHaveAccessibleDescription(
      'Você não pode remover o perfil de administrador da própria conta.',
    );
  });
});

describe('doctor profile', () => {
  it('creates a profile from the panel with the registry labelled by the specialty council', async () => {
    const created = vi.fn();
    serve({
      ...catalog,
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
      '/api/admin/users/ana/doctor-profile': (_method, body) => {
        created(body);
        return created.mock.calls.length === 1
          ? conflict('REGISTRY_TAKEN', {
              registryNumber: 'Este registro profissional já pertence a outro médico.',
            })
          : ok(
              detail({ ...ana, roles: ['patient', 'doctor'] }, { ...joaoProfile, specialtyId: 'nutri' }),
              201,
            );
      },
    });
    const { user, router } = renderApp('/admin/usuarios?usuario=ana');

    const start = await screen.findByRole('button', { name: 'Tornar médico' });
    await user.click(start);
    const dialog = await panel('Tornar médico');
    expect(searchOf(router)).toEqual({ usuario: 'ana', secao: 'medico' });
    expect(await within(dialog).findByRole('textbox', { name: 'Nome' })).toHaveAttribute('readonly');
    const specialty = within(dialog).getByRole('combobox', { name: 'Especialidade' });
    expect(within(specialty).queryByRole('option', { name: 'Antiga' })).not.toBeInTheDocument();

    await user.selectOptions(specialty, 'cardio');
    expect(within(dialog).getByRole('textbox', { name: 'Número do CRM' })).toBeInTheDocument();
    await user.selectOptions(specialty, 'nutri');
    const registry = within(dialog).getByRole('textbox', { name: 'Número do CRN' });

    await user.type(registry, '4567');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'UF' }), 'RS');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Unidade' }), 'norte');
    await user.click(within(dialog).getByRole('button', { name: 'Tornar médico' }));

    expect(
      await screen.findByText('Este registro profissional já pertence a outro médico.'),
    ).toBeInTheDocument();
    expect(registry).toHaveAttribute('aria-invalid', 'true');

    await user.clear(registry);
    await user.type(registry, '4568');
    await user.click(within(dialog).getByRole('button', { name: 'Tornar médico' }));

    expect(await screen.findByText('Ana Ferreira agora tem perfil de médico.')).toBeInTheDocument();
    expect(created).toHaveBeenLastCalledWith({
      specialtyId: 'nutri',
      registryNumber: '4568',
      registryUf: 'RS',
      unitId: 'norte',
    });
    expect(searchOf(router)).toEqual({ usuario: 'ana' });
    expect(await panel('Editar usuário')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Editar perfil de médico' })).toHaveFocus();
  });

  it('validates the registry number before calling the API', async () => {
    const { calls } = serve({
      ...catalog,
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana&secao=medico');

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Especialidade' }), 'cardio');
    await user.type(screen.getByRole('textbox', { name: 'Número do CRM' }), '0123');
    await user.click(screen.getByRole('button', { name: 'Tornar médico' }));

    expect(await screen.findByText(/sem zeros à esquerda/)).toBeInTheDocument();
    expect(screen.getByText('Escolha a UF do registro.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('does not focus the doctor button of the next user opened after closing', async () => {
    serve({
      ...catalog,
      '/api/admin/users': listOf(ana, joao),
      '/api/admin/users/ana': () => ok(detail(ana)),
      '/api/admin/users/joao': () => ok(detail(joao, joaoProfile)),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana&secao=medico');

    const dialog = await panel('Tornar médico');
    await within(dialog).findByRole('combobox', { name: 'Especialidade' });
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(await rowOf('João Silveira'));

    const editor = await panel('Editar usuário');
    const doctorButton = await within(editor).findByRole('button', { name: 'Editar perfil de médico' });
    expect(doctorButton).not.toHaveFocus();
  });

  it('goes back to the user without saving', async () => {
    serve({
      ...catalog,
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
    });
    const { user, router } = renderApp('/admin/usuarios?usuario=ana&secao=medico');

    const dialog = await panel('Tornar médico');
    await user.click(await within(dialog).findByRole('button', { name: 'Cancelar' }));

    expect(await panel('Editar usuário')).toBeInTheDocument();
    expect(searchOf(router)).toEqual({ usuario: 'ana' });
  });

  it('edits and removes an existing profile', async () => {
    const changes = vi.fn();
    serve({
      ...catalog,
      '/api/admin/users': listOf(joao),
      '/api/admin/users/joao': () => ok(detail(joao, joaoProfile)),
      '/api/admin/users/joao/deactivation-impact': () =>
        ok({ futureAppointmentsAsPatient: 0, futureAppointmentsAsDoctor: 1 }),
      '/api/admin/users/joao/doctor-profile': (method, body) => {
        changes(method, body);
        return method === 'DELETE'
          ? ok(detail({ ...joao, roles: ['patient'] }))
          : ok(detail(joao, { ...joaoProfile, unitId: 'norte', unitName: 'Unidade Norte' }));
      },
    });
    const { user, router } = renderApp('/admin/usuarios?usuario=joao&secao=medico');

    const unitField = await screen.findByRole('combobox', { name: 'Unidade' });
    expect(screen.getByRole('textbox', { name: 'Número do CRM' })).toHaveValue('123456');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();

    await user.selectOptions(unitField, 'norte');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Perfil de médico atualizado.')).toBeInTheDocument();
    expect(changes).toHaveBeenCalledWith('PATCH', { unitId: 'norte' });

    await user.click(await screen.findByRole('button', { name: 'Editar perfil de médico' }));
    await user.click(await screen.findByRole('button', { name: 'Remover perfil de médico' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Remover o perfil de médico de João Silveira?',
    });
    expect(await within(dialog).findByText(/1 consulta futura será cancelada/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Remover perfil' }));

    expect(await screen.findByText('Perfil de médico removido.')).toBeInTheDocument();
    expect(changes).toHaveBeenLastCalledWith('DELETE', undefined);
    expect(searchOf(router)).toEqual({ usuario: 'joao' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tornar médico' })).toHaveFocus());
  });

  it('sends only the registry when the current specialty and unit are inactive', async () => {
    const changes = vi.fn();
    const legacy = {
      ...joaoProfile,
      specialtyId: 'old',
      specialtyName: 'Antiga',
      unitId: 'velha',
      unitName: 'Unidade Velha',
    };
    serve({
      ...catalog,
      '/api/admin/users': listOf(joao),
      '/api/admin/users/joao': () => ok(detail(joao, legacy)),
      '/api/admin/users/joao/doctor-profile': (method, body) => {
        changes(method, body);
        return ok(detail(joao, { ...legacy, registryNumber: '654321' }));
      },
    });
    const { user } = renderApp('/admin/usuarios?usuario=joao&secao=medico');

    const specialty = await screen.findByRole('combobox', { name: 'Especialidade' });
    expect(specialty).toHaveValue('old');
    expect(within(specialty).getByRole('option', { name: 'Antiga (desativada)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Unidade' })).toHaveValue('velha');

    const registry = screen.getByRole('textbox', { name: 'Número do CRM' });
    await user.clear(registry);
    await user.type(registry, '654321');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Perfil de médico atualizado.')).toBeInTheDocument();
    expect(changes).toHaveBeenCalledWith('PATCH', { registryNumber: '654321' });
  });

  it.each([
    ['REGISTRY_TAKEN', 409, 'registryNumber', 'Número do CRM'],
    ['SPECIALTY_UNAVAILABLE', 422, 'specialtyId', 'Especialidade'],
    ['UNIT_UNAVAILABLE', 422, 'unitId', 'Unidade'],
  ])('shows %s next to its field', async (code, status, field, label) => {
    serve({
      ...catalog,
      '/api/admin/users': listOf(joao),
      '/api/admin/users/joao': () => ok(detail(joao, joaoProfile)),
      '/api/admin/users/joao/doctor-profile': () =>
        conflict(code, { [field]: `Problema em ${field}.` }, status),
    });
    const { user } = renderApp('/admin/usuarios?usuario=joao&secao=medico');

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Unidade' }), 'norte');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText(`Problema em ${field}.`)).toBeInTheDocument();
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains when future appointments block the change', async () => {
    serve({
      ...catalog,
      '/api/admin/users': listOf(joao),
      '/api/admin/users/joao': () => ok(detail(joao, joaoProfile)),
      '/api/admin/users/joao/doctor-profile': () => conflict('HAS_FUTURE_APPOINTMENTS'),
    });
    const { user } = renderApp('/admin/usuarios?usuario=joao&secao=medico');

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Unidade' }), 'norte');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText(/Este médico tem consultas futuras/)).toBeInTheDocument();
  });

  it('tells when the account already became a doctor', async () => {
    serve({
      ...catalog,
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
      '/api/admin/users/ana/doctor-profile': () => conflict('DOCTOR_PROFILE_EXISTS'),
    });
    const { user } = renderApp('/admin/usuarios?usuario=ana&secao=medico');

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Especialidade' }), 'cardio');
    await user.type(screen.getByRole('textbox', { name: 'Número do CRM' }), '4567');
    await user.selectOptions(screen.getByRole('combobox', { name: 'UF' }), 'SP');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Unidade' }), 'central');
    await user.click(screen.getByRole('button', { name: 'Tornar médico' }));

    expect(await screen.findByText('Esta conta já tem perfil de médico.')).toBeInTheDocument();
  });

  it('keeps the submit disabled while the catalog loads', async () => {
    holdSpecialties(
      serve({
        '/api/units': () => ok(units),
        '/api/admin/users': listOf(ana),
        '/api/admin/users/ana': () => ok(detail(ana)),
      }),
    );
    renderApp('/admin/usuarios?usuario=ana&secao=medico');

    const dialog = await panel('Tornar médico');
    expect(await within(dialog).findByRole('button', { name: 'Tornar médico' })).toBeDisabled();
    expect(within(dialog).queryByRole('combobox', { name: 'Especialidade' })).not.toBeInTheDocument();
  });

  it('keeps the form disabled when the catalog cannot be loaded', async () => {
    serve({
      '/api/specialties': () => ({ status: 500 }),
      '/api/units': () => ok(units),
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana': () => ok(detail(ana)),
    });
    renderApp('/admin/usuarios?usuario=ana&secao=medico');

    expect(await screen.findByRole('combobox', { name: 'Especialidade' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Número do registro profissional' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tornar médico' })).toBeDisabled();
  });
});

describe('create user', () => {
  const created = person('nova', 'Carla Mendes');

  async function openForm(routes: Record<string, ApiRoute>) {
    const api = serve({ ...catalog, '/api/admin/users': listOf(ana), ...routes });
    const rendered = renderApp('/admin/usuarios');
    await rowOf('Ana Ferreira');
    const open = screen.getByRole('button', { name: 'Novo usuário' });
    await rendered.user.click(open);
    const form = await panel('Novo usuário');
    return { ...api, ...rendered, form, open };
  }

  async function fillPerson(
    user: ReturnType<typeof renderApp>['user'],
    form: HTMLElement,
    email = 'carla@email.com',
  ) {
    await user.type(within(form).getByRole('textbox', { name: 'E-mail' }), email);
    await user.type(within(form).getByRole('textbox', { name: 'Nome completo' }), 'Carla Mendes');
  }

  async function chooseRole(user: ReturnType<typeof renderApp>['user'], form: HTMLElement, role: string) {
    await user.click(within(form).getByRole('button', { name: /^Perfil/ }));
    await user.click(await screen.findByRole('option', { name: new RegExp(`^${role}`) }));
  }

  async function fillDoctor(user: ReturnType<typeof renderApp>['user'], form: HTMLElement) {
    await user.selectOptions(await within(form).findByRole('combobox', { name: 'Especialidade' }), 'cardio');
    await user.type(within(form).getByRole('textbox', { name: 'Número do CRM' }), '123456');
    await user.selectOptions(within(form).getByRole('combobox', { name: 'UF' }), 'SP');
    await user.selectOptions(within(form).getByRole('combobox', { name: 'Unidade' }), 'norte');
  }

  const posts = (calls: ReturnType<typeof serve>['calls']) =>
    calls.filter((call) => call.method === 'POST' && call.url.pathname === '/api/admin/users');

  it('creates a patient, refreshes the list and gives the focus back to the button', async () => {
    const { calls, user, router, form, open } = await openForm({
      '/api/admin/users': (method) => (method === 'POST' ? ok(detail(created), 201) : ok(page([ana]))),
    });
    const lists = () =>
      calls.filter((call) => call.method === 'GET' && call.url.pathname === '/api/admin/users').length;

    expect(searchOf(router)).toEqual({ usuario: 'novo' });
    expect(within(form).getByRole('form', { name: 'Novo usuário' })).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: /^Perfil/ })).toHaveTextContent('Paciente');
    expect(within(form).queryByRole('combobox', { name: 'Especialidade' })).not.toBeInTheDocument();

    await fillPerson(user, form);
    await user.type(within(form).getByRole('textbox', { name: /Telefone/ }), '(11) 98765-4321');
    const before = lists();
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(
      await screen.findByText('Usuário criado. Ele recebe um e-mail para criar a senha.'),
    ).toBeInTheDocument();
    expect(posts(calls).at(-1)?.body).toEqual({
      fullName: 'Carla Mendes',
      email: 'carla@email.com',
      phone: '(11) 98765-4321',
      role: 'patient',
    });
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Novo usuário' })).not.toBeInTheDocument(),
    );
    expect(open).toHaveFocus();
    await waitFor(() => expect(lists()).toBeGreaterThan(before));
  });

  it('creates an administrator without a phone', async () => {
    const { calls, user, form } = await openForm({
      '/api/admin/users': (method) => (method === 'POST' ? ok(detail(created), 201) : ok(page([ana]))),
    });

    await fillPerson(user, form);
    await chooseRole(user, form, 'Administrador');
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(
      await screen.findByText('Usuário criado. Ele recebe um e-mail para criar a senha.'),
    ).toBeInTheDocument();
    expect(posts(calls).at(-1)?.body).toEqual({
      fullName: 'Carla Mendes',
      email: 'carla@email.com',
      role: 'admin',
    });
  });

  it('creates a doctor with the professional data', async () => {
    const { calls, user, form } = await openForm({
      '/api/admin/users': (method) =>
        method === 'POST'
          ? ok(detail({ ...created, roles: ['patient', 'doctor'] }, joaoProfile), 201)
          : ok(page([ana])),
    });

    await fillPerson(user, form);
    await chooseRole(user, form, 'Médico');
    expect(within(form).getByRole('button', { name: /^Perfil/ })).toHaveTextContent('Médico');
    await fillDoctor(user, form);
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(
      await screen.findByText('Usuário criado. Ele recebe um e-mail para criar a senha.'),
    ).toBeInTheDocument();
    expect(posts(calls).at(-1)?.body).toEqual({
      fullName: 'Carla Mendes',
      email: 'carla@email.com',
      role: 'doctor',
      doctorProfile: { specialtyId: 'cardio', registryNumber: '123456', registryUf: 'SP', unitId: 'norte' },
    });
  });

  it('keeps the submit disabled for a doctor while the catalog loads', async () => {
    const api = serve({ '/api/units': () => ok(units), '/api/admin/users': listOf(ana) });
    holdSpecialties(api);
    const { user } = renderApp('/admin/usuarios?usuario=novo');
    const form = await panel('Novo usuário');
    const submit = within(form).getByRole('button', { name: 'Criar usuário' });
    expect(submit).toBeEnabled();

    await chooseRole(user, form, 'Médico');

    expect(submit).toBeDisabled();
    expect(within(form).queryByRole('combobox', { name: 'Especialidade' })).not.toBeInTheDocument();
  });

  it('checks the required fields before calling the API', async () => {
    const { calls, user, form } = await openForm({});

    await chooseRole(user, form, 'Médico');
    await within(form).findByRole('combobox', { name: 'Especialidade' });
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(await within(form).findByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(within(form).getByRole('textbox', { name: 'Nome completo' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(within(form).getByRole('combobox', { name: 'Especialidade' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(within(form).getByText('Escolha a unidade.')).toBeInTheDocument();
    expect(posts(calls)).toHaveLength(0);
  });

  it.each([
    ['VALIDATION_ERROR', 400, 'email', 'E-mail', 'Informe um e-mail válido.'],
    ['VALIDATION_ERROR', 400, 'fullName', 'Nome completo', 'Informe o nome completo.'],
    ['EMAIL_TAKEN', 409, 'email', 'E-mail', 'Este e-mail já está cadastrado.'],
  ])('shows %s on the %s field', async (code, status, field, label, message) => {
    const { user, form } = await openForm({
      '/api/admin/users': (method) =>
        method === 'POST' ? conflict(code, { [field]: message }, status) : ok(page([ana])),
    });

    await fillPerson(user, form);
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(await within(form).findByText(message)).toBeInTheDocument();
    expect(within(form).getByRole('textbox', { name: label })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('dialog', { name: 'Novo usuário' })).toBeInTheDocument();
  });

  it.each([
    ['REGISTRY_TAKEN', 409, 'doctorProfile.registryNumber', 'Número do CRM'],
    ['REGISTRY_TAKEN', 409, 'registryNumber', 'Número do CRM'],
    ['SPECIALTY_UNAVAILABLE', 422, 'doctorProfile.specialtyId', 'Especialidade'],
    ['UNIT_UNAVAILABLE', 422, 'doctorProfile.unitId', 'Unidade'],
  ])('shows %s from %s on the doctor field', async (code, status, field, label) => {
    const { user, form } = await openForm({
      '/api/admin/users': (method) =>
        method === 'POST' ? conflict(code, { [field]: `Problema em ${field}.` }, status) : ok(page([ana])),
    });

    await fillPerson(user, form);
    await chooseRole(user, form, 'Médico');
    await fillDoctor(user, form);
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(await within(form).findByText(`Problema em ${field}.`)).toBeInTheDocument();
    expect(within(form).getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains when the server is busy and keeps what was typed', async () => {
    const { user, form } = await openForm({
      '/api/admin/users': (method) =>
        method === 'POST' ? conflict('SERVER_BUSY', undefined, 503) : ok(page([ana])),
    });

    await fillPerson(user, form);
    await user.click(within(form).getByRole('button', { name: 'Criar usuário' }));

    expect(
      await within(form).findByText('O servidor está ocupado. Tente de novo em instantes.'),
    ).toBeInTheDocument();
    expect(within(form).getByRole('textbox', { name: 'E-mail' })).toHaveValue('carla@email.com');
  });
});
