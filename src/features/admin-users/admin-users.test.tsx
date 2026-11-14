import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, serveApi, testUser, type ApiRoute } from '@/test/render-app';
import type { AdminUser } from './users-api';

const SELF_ID = testUser().id;

const person = (id: string, fullName: string, overrides: Partial<AdminUser> = {}): AdminUser => ({
  id,
  fullName,
  email: `${id}@email.com`,
  phone: null,
  roles: ['patient'],
  isProtected: false,
  deactivatedAt: null,
  createdAt: '2026-11-01T12:00:00.000Z',
  ...overrides,
});

const joao = person('joao', 'João Silveira', { roles: ['doctor'] });
const ana = person('ana', 'Ana Ferreira', { phone: '+5511987654321' });
const demo = person('demo', 'Conta Demonstração', { isProtected: true });
const me = person(SELF_ID, 'Ana Maria Silva', { roles: ['admin'] });

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
const units = [
  {
    id: 'central',
    name: 'Unidade Central',
    address: 'Rua A, 1',
    phone: '+551133334444',
    isActive: true,
    hours: [],
  },
  {
    id: 'norte',
    name: 'Unidade Norte',
    address: 'Rua B, 2',
    phone: '+551133335555',
    isActive: true,
    hours: [],
  },
];

const page = (items: unknown[], total = items.length) => ({ items, page: 1, pageSize: 20, total });
const ok = (body: unknown, status = 200) => ({ status, body });
const conflict = (code: string, fields?: Record<string, string>) => ({
  status: 409,
  body: { code, message: 'Conflito.', ...(fields && { fields }) },
});

const serve = (routes: Record<string, ApiRoute>) => serveApi(['admin'], routes);
const listOf =
  (...items: unknown[]): ApiRoute =>
  () =>
    ok(page(items, 45));

afterEach(() => {
  vi.unstubAllGlobals();
});

const rowOf = async (name: string) =>
  (await screen.findByRole('link', { name })).closest('tr') as HTMLElement;

async function openActions(user: ReturnType<typeof renderApp>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: `Ações para ${name}` }));
  return screen.getByRole('menu', { name: `Ações para ${name}` });
}

describe('admin users list', () => {
  it('lists the accounts with their status and profiles in a table', async () => {
    serve({ '/api/admin/users': listOf(joao, ana, demo, me) });
    renderApp('/admin/usuarios');

    const table = await screen.findByRole('table', { name: 'Usuários' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText('45 usuários encontrados')).toBeInTheDocument();
    expect(within(await rowOf('João Silveira')).getByText('Médico')).toBeInTheDocument();
    expect(within(await rowOf('Conta Demonstração')).getByText('Demonstração')).toBeInTheDocument();
    expect(within(await rowOf('Ana Maria Silva')).getByText('Você')).toBeInTheDocument();
  });

  it('keeps search, profile, status and page in the URL and in the request', async () => {
    const { calls } = serve({ '/api/admin/users': listOf(joao, ana) });
    const { user, router } = renderApp('/admin/usuarios?pagina=2');
    const lastQuery = () =>
      calls.filter((call) => call.url.pathname === '/api/admin/users').at(-1)?.url.searchParams;

    await screen.findByText('João Silveira');
    expect(lastQuery()?.get('page')).toBe('2');

    await user.type(screen.getByRole('searchbox', { name: 'Buscar usuários' }), ' ana ');
    await waitFor(() => expect(lastQuery()?.get('search')).toBe('ana'));
    expect(lastQuery()?.get('page')).toBe('1');

    await user.click(screen.getByRole('tab', { name: 'Médicos' }));
    await waitFor(() => expect(lastQuery()?.get('role')).toBe('doctor'));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'inativos');
    await waitFor(() => expect(lastQuery()?.get('status')).toBe('inactive'));

    await user.click(screen.getByRole('button', { name: 'Página 3' }));
    await waitFor(() => expect(lastQuery()?.get('page')).toBe('3'));
    expect(Object.fromEntries(new URLSearchParams(router.state.location.search))).toEqual({
      busca: 'ana',
      perfil: 'medicos',
      situacao: 'inativos',
      pagina: '3',
    });
  });

  it('tells when no account matches the filters', async () => {
    serve({ '/api/admin/users': () => ok(page([])) });
    renderApp('/admin/usuarios?busca=zzz');

    expect(await screen.findByText('Nenhum usuário encontrado')).toBeInTheDocument();
  });

  it('confirms a deactivation with the bookings that will be cancelled', async () => {
    const { calls } = serve({
      '/api/admin/users': listOf(joao, ana),
      '/api/admin/users/joao/deactivation-impact': () =>
        ok({ futureAppointmentsAsPatient: 2, futureAppointmentsAsDoctor: 1 }),
      '/api/admin/users/joao/deactivate': () =>
        ok(detail({ ...joao, deactivatedAt: '2026-11-13T12:00:00Z' })),
    });
    const { user } = renderApp('/admin/usuarios');

    await user.click(
      within(await openActions(user, 'João Silveira')).getByRole('menuitem', { name: 'Desativar' }),
    );
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
  });

  it('explains when the last administrator would be lost', async () => {
    const other = person('bia', 'Bia Admin', { roles: ['admin'] });
    serve({
      '/api/admin/users': listOf(other),
      '/api/admin/users/bia/roles/admin': (method) =>
        method === 'DELETE' ? conflict('SELF_OR_LAST_ADMIN') : undefined,
    });
    const { user } = renderApp('/admin/usuarios');

    await user.click(
      within(await openActions(user, 'Bia Admin')).getByRole('menuitem', { name: 'Remover admin' }),
    );
    await user.click(
      within(await screen.findByRole('dialog', { name: /Remover o perfil de administrador/ })).getByRole(
        'button',
        {
          name: 'Remover admin',
        },
      ),
    );

    expect(await screen.findByText(/pelo menos um administrador ativo/)).toBeInTheDocument();
  });

  it('grants the administrator profile after confirming', async () => {
    const { calls } = serve({
      '/api/admin/users': listOf(ana),
      '/api/admin/users/ana/roles/admin': () => ok(detail({ ...ana, roles: ['patient', 'admin'] })),
    });
    const { user } = renderApp('/admin/usuarios');

    await user.click(
      within(await openActions(user, 'Ana Ferreira')).getByRole('menuitem', { name: 'Tornar admin' }),
    );
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tornar admin' }));

    expect(await screen.findByText('Ana Ferreira agora tem perfil de administrador.')).toBeInTheDocument();
    expect(calls.find((call) => call.url.pathname === '/api/admin/users/ana/roles/admin')?.method).toBe(
      'POST',
    );
  });

  it('disables changes to protected accounts and to the own account', async () => {
    serve({ '/api/admin/users': listOf(demo, me) });
    const { user } = renderApp('/admin/usuarios');

    const demoMenu = await openActions(user, 'Conta Demonstração');
    for (const name of ['Tornar médico', 'Tornar admin', 'Desativar'])
      expect(within(demoMenu).getByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true');
    expect(within(demoMenu).getByRole('menuitem', { name: 'Editar' })).not.toHaveAttribute('aria-disabled');
    await user.keyboard('{Escape}');

    const myMenu = await openActions(user, 'Ana Maria Silva');
    expect(within(myMenu).getByRole('menuitem', { name: 'Desativar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(myMenu).getByRole('menuitem', { name: 'Remover admin' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

describe('edit user', () => {
  it('saves name and phone with the e-mail read-only', async () => {
    const patch = vi.fn();
    serve({
      '/api/admin/users/ana': (method, body) => {
        if (method !== 'PATCH') return ok(detail(ana));
        patch(body);
        return ok(detail({ ...ana, fullName: 'Ana F. Souza', phone: null }));
      },
    });
    const { user } = renderApp('/admin/usuarios/ana');

    const name = await screen.findByRole('textbox', { name: 'Nome completo' });
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: /Telefone/ })).toHaveValue('(11) 98765-4321');
    expect(screen.queryByLabelText(/senha/i, { selector: 'input' })).not.toBeInTheDocument();

    await user.clear(name);
    await user.type(name, 'Ana F. Souza');
    await user.clear(screen.getByRole('textbox', { name: /Telefone/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados atualizados.')).toBeInTheDocument();
    expect(patch).toHaveBeenCalledWith({ fullName: 'Ana F. Souza', phone: null });
  });

  it('sends a password reset link and explains when it cannot be sent now', async () => {
    let attempts = 0;
    serve({
      '/api/admin/users/ana': () => ok(detail(ana)),
      '/api/admin/users/ana/password-reset': () =>
        attempts++ === 0 ? { status: 202 } : conflict('RESET_NOT_SENT'),
    });
    const { user } = renderApp('/admin/usuarios/ana');

    const send = await screen.findByRole('button', { name: 'Enviar link de redefinição' });
    await user.click(send);
    expect(await screen.findByText('Link de redefinição enviado para ana@email.com.')).toBeInTheDocument();

    await user.click(send);
    expect(await screen.findByText(/Um link foi enviado há pouco/)).toBeInTheDocument();
  });

  it('shows the doctor profile and reactivates an inactive account', async () => {
    const inactive = { ...joao, deactivatedAt: '2026-11-10T12:00:00Z' };
    serve({
      '/api/admin/users/joao': () => ok(detail(inactive, joaoProfile)),
      '/api/admin/users/joao/reactivate': () => ok(detail(joao, joaoProfile)),
    });
    const { user } = renderApp('/admin/usuarios/joao');

    expect(await screen.findByText('CRM 123456/SP')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Esta conta está desativada');
    expect(screen.getByRole('button', { name: 'Enviar link de redefinição' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Reativar conta' }));

    expect(await screen.findByText('Conta de João Silveira reativada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('note')).not.toBeInTheDocument());
  });

  it('keeps a protected account read-only with an explanation', async () => {
    serve({ '/api/admin/users/demo': () => ok(detail(demo)) });
    renderApp('/admin/usuarios/demo');

    expect(await screen.findByRole('note')).toHaveTextContent('conta de demonstração');
    expect(screen.getByRole('textbox', { name: 'Nome completo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Desativar conta' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tornar admin' })).toBeDisabled();
  });

  it('tells when the account no longer exists', async () => {
    serve({ '/api/admin/users/gone': () => ({ status: 404, body: { code: 'NOT_FOUND', message: 'x' } }) });
    renderApp('/admin/usuarios/gone');

    expect(await screen.findByText('Este usuário não existe mais. Volte para a lista.')).toBeInTheDocument();
  });
});

describe('doctor profile', () => {
  const catalog = {
    '/api/specialties': () => ok(specialties),
    '/api/units': () => ok(units),
  };

  it('creates a profile with the registry labelled by the specialty council', async () => {
    const created = vi.fn();
    serve({
      ...catalog,
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
    const { user, router } = renderApp('/admin/usuarios/ana/medico');

    expect(await screen.findByRole('textbox', { name: 'Nome' })).toHaveAttribute('readonly');
    const specialty = screen.getByRole('combobox', { name: 'Especialidade' });
    expect(within(specialty).queryByRole('option', { name: 'Antiga' })).not.toBeInTheDocument();

    await user.selectOptions(specialty, 'cardio');
    expect(screen.getByRole('textbox', { name: 'Número do CRM' })).toBeInTheDocument();
    await user.selectOptions(specialty, 'nutri');
    const registry = screen.getByRole('textbox', { name: 'Número do CRN' });

    await user.type(registry, '4567');
    await user.selectOptions(screen.getByRole('combobox', { name: 'UF' }), 'RS');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Unidade' }), 'norte');
    await user.click(screen.getByRole('button', { name: 'Tornar médico' }));

    expect(
      await screen.findByText('Este registro profissional já pertence a outro médico.'),
    ).toBeInTheDocument();
    expect(registry).toHaveAttribute('aria-invalid', 'true');

    await user.clear(registry);
    await user.type(registry, '4568');
    await user.click(screen.getByRole('button', { name: 'Tornar médico' }));

    expect(await screen.findByText('Ana Ferreira agora tem perfil de médico.')).toBeInTheDocument();
    expect(created).toHaveBeenLastCalledWith({
      specialtyId: 'nutri',
      registryNumber: '4568',
      registryUf: 'RS',
      unitId: 'norte',
    });
    expect(router.state.location.pathname).toBe('/admin/usuarios/ana');
  });

  it('validates the registry number before calling the API', async () => {
    const { calls } = serve({ ...catalog, '/api/admin/users/ana': () => ok(detail(ana)) });
    const { user } = renderApp('/admin/usuarios/ana/medico');

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Especialidade' }), 'cardio');
    await user.type(screen.getByRole('textbox', { name: 'Número do CRM' }), '0123');
    await user.click(screen.getByRole('button', { name: 'Tornar médico' }));

    expect(await screen.findByText(/sem zeros à esquerda/)).toBeInTheDocument();
    expect(screen.getByText('Escolha a UF do registro.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('edits and removes an existing profile', async () => {
    const changes = vi.fn();
    serve({
      ...catalog,
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
    const { user, router } = renderApp('/admin/usuarios/joao/medico');

    const unit = await screen.findByRole('combobox', { name: 'Unidade' });
    expect(screen.getByRole('textbox', { name: 'Número do CRM' })).toHaveValue('123456');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();

    await user.selectOptions(unit, 'norte');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Perfil de médico atualizado.')).toBeInTheDocument();
    expect(changes).toHaveBeenCalledWith('PATCH', {
      specialtyId: 'cardio',
      registryNumber: '123456',
      registryUf: 'SP',
      unitId: 'norte',
    });

    await user.click(await screen.findByRole('link', { name: 'Editar perfil de médico' }));
    await user.click(await screen.findByRole('button', { name: 'Remover perfil de médico' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Remover o perfil de médico de João Silveira?',
    });
    expect(await within(dialog).findByText(/1 consulta futura será cancelada/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Remover perfil' }));

    expect(await screen.findByText('Perfil de médico removido.')).toBeInTheDocument();
    expect(changes).toHaveBeenLastCalledWith('DELETE', undefined);
    expect(router.state.location.pathname).toBe('/admin/usuarios/joao');
  });
});
