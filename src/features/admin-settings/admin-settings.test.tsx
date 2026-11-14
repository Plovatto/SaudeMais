import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, signIn, type MockResponse } from '@/test/render-app';

type Route = (method: string, body: unknown, url: URL) => MockResponse | undefined;

const specialty = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `spec-${index}`,
  name: `Especialidade ${index}`,
  council: 'CRM',
  appointmentDurationMin: 30,
  isActive: true,
  ...overrides,
});

const page = <T,>(items: T[], total = items.length, current = 1) => ({
  items,
  page: current,
  pageSize: 20,
  total,
});

const unit = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  name: 'Central',
  address: 'Rua A, 1',
  phone: '+551133334444',
  isActive: true,
  hours: [],
  ...overrides,
});

const examType = (id: string, name: string, isActive = true) => ({
  id,
  code: name.toLowerCase().replace(/\W/g, '_'),
  name,
  kind: 'imaging',
  durationMin: 15,
  preparationNotes: null,
  isActive,
});

const policy = {
  appointmentLateWindowHours: 24,
  examLateWindowHours: 2,
  maxReschedules: 2,
  bookingHorizonDays: 60,
  minLeadMinutes: 60,
  updatedAt: '2026-11-20T12:00:00.000Z',
};

function serve(routes: Record<string, Route>) {
  const calls: { method: string; url: URL; body: unknown }[] = [];
  const fetchMock = signIn(['admin'], (path, init) => {
    const method = init?.method ?? 'GET';
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const url = new URL(path, 'https://api.test');
    calls.push({ method, url, body });
    return routes[path]?.(method, body, url);
  });
  return { calls, fetchMock };
}

const requestUrls = (fetchMock: ReturnType<typeof serve>['fetchMock']) =>
  fetchMock.mock.calls.map(([url]) => String(url instanceof Request ? url.url : url));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('admin settings', () => {
  it('opens the specialties section by default with details and pages', async () => {
    const { fetchMock } = serve({
      '/api/admin/specialties': () => ({
        status: 200,
        body: page([specialty(1), specialty(2, { isActive: false, council: 'CRN' })], 45),
      }),
    });
    const { user, router } = renderApp('/admin/configuracoes');

    expect(await screen.findByText('Especialidade 1')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/configuracoes/especialidades');
    expect(screen.getByRole('tab', { name: 'Especialidades' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('CRN · consultas de 30 min')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Página 2' }));

    await waitFor(() => expect(requestUrls(fetchMock).some((url) => url.includes('page=2'))).toBe(true));
    expect(router.state.location.search).toBe('?pagina=2');
  });

  it('reads the page from the URL and moves back to the last page when it is past the end', async () => {
    const { fetchMock } = serve({
      '/api/admin/specialties': () => ({ status: 200, body: page([specialty(1)], 45) }),
    });
    const { router } = renderApp('/admin/configuracoes/especialidades?pagina=9');

    await waitFor(() => expect(router.state.location.search).toBe('?pagina=3'));
    expect(requestUrls(fetchMock).some((url) => url.includes('page=9'))).toBe(true);
    await waitFor(() => expect(requestUrls(fetchMock).some((url) => url.includes('page=3'))).toBe(true));
  });

  it('marks only the item being changed as busy', async () => {
    const { fetchMock } = serve({
      '/api/admin/specialties': () => ({
        status: 200,
        body: page([specialty(1, { isActive: false }), specialty(2, { isActive: false })]),
      }),
    });
    const { user } = renderApp('/admin/configuracoes/especialidades');
    const first = await screen.findByRole('switch', { name: 'Especialidade 1 ativo' });
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));

    await user.click(first);

    await waitFor(() => expect(first).toHaveAttribute('aria-busy', 'true'));
    expect(screen.getByRole('switch', { name: 'Especialidade 2 ativo' })).not.toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('explains a removed item and an item still in use when changing it', async () => {
    serve({
      '/api/admin/specialties': () => ({
        status: 200,
        body: page([specialty(1, { isActive: false }), specialty(2)]),
      }),
      '/api/admin/specialties/spec-1': () => ({
        status: 404,
        body: { message: 'Specialty not found.', code: 'NOT_FOUND' },
      }),
      '/api/admin/specialties/spec-2': () => ({ status: 409, body: { message: 'Em uso.', code: 'IN_USE' } }),
    });
    const { user } = renderApp('/admin/configuracoes/especialidades');

    await user.click(await screen.findByRole('switch', { name: 'Especialidade 1 ativo' }));
    expect(await screen.findByText('Este item não existe mais. Atualize a lista.')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Especialidade 2 ativo' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Desativar Especialidade 2?' })).getByRole('button', {
        name: 'Desativar',
      }),
    );
    expect(await screen.findByText(/Há agendamentos futuros ligados a este item/)).toBeInTheDocument();
  });

  it('shows an empty state for a list without items', async () => {
    serve({ '/api/admin/exam-types': () => ({ status: 200, body: page([]) }) });
    renderApp('/admin/configuracoes/exames');

    expect(await screen.findByText('Nenhum tipo de exame cadastrado')).toBeInTheDocument();
  });

  it('validates a new exam type and sends empty preparation notes as null', async () => {
    let attempts = 0;
    const { calls } = serve({
      '/api/admin/exam-types': (method, body) => {
        if (method !== 'POST') return { status: 200, body: page([]) };
        attempts += 1;
        return attempts === 1
          ? { status: 409, body: { message: 'Código em uso.', code: 'CODE_TAKEN' } }
          : { status: 201, body: { id: 'e1', isActive: true, ...(body as object) } };
      },
    });
    const { user } = renderApp('/admin/configuracoes/exames');
    await user.click((await screen.findAllByRole('button', { name: 'Novo tipo de exame' }))[0]!);
    const form = await screen.findByRole('form', { name: 'Tipo de exame' });
    const duration = within(form).getByLabelText('Duração (minutos)');

    await user.type(within(form).getByLabelText('Nome'), 'Hemograma');
    await user.type(within(form).getByLabelText('Código'), 'Hemo-grama');
    await user.clear(duration);
    await user.type(duration, '17');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText(/Use letras minúsculas, números e _/)).toBeInTheDocument();
    expect(within(form).getByText('Use múltiplos de 5 minutos.')).toBeInTheDocument();

    await user.clear(within(form).getByLabelText('Código'));
    await user.type(within(form).getByLabelText('Código'), 'hemograma');
    await user.clear(duration);
    await user.type(duration, '20');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('Já existe um tipo de exame com esse código.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      code: 'hemograma',
      name: 'Hemograma',
      kind: 'lab',
      durationMin: 20,
      preparationNotes: null,
    });
  });

  it('validates a new specialty and shows conflicts from the API on the field', async () => {
    const { calls } = serve({
      '/api/admin/specialties': (method) =>
        method === 'POST'
          ? {
              status: 409,
              body: {
                message: 'Já existe.',
                code: 'NAME_TAKEN',
                fields: { name: 'Já existe uma especialidade com esse nome.' },
              },
            }
          : { status: 200, body: page([]) },
    });
    const { user } = renderApp('/admin/configuracoes/especialidades');
    await user.click((await screen.findAllByRole('button', { name: 'Nova especialidade' }))[0]!);
    const form = await screen.findByRole('form', { name: 'Especialidade' });

    await user.type(within(form).getByLabelText('Nome'), 'Cardiologia');
    await user.clear(within(form).getByLabelText('Conselho profissional'));
    await user.type(within(form).getByLabelText('Conselho profissional'), 'cr');
    await user.clear(within(form).getByLabelText('Duração da consulta (minutos)'));
    await user.type(within(form).getByLabelText('Duração da consulta (minutos)'), '32');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('Use múltiplos de 5 minutos.')).toBeInTheDocument();
    expect(within(form).getByText(/Use a sigla do conselho/)).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    await user.clear(within(form).getByLabelText('Conselho profissional'));
    await user.type(within(form).getByLabelText('Conselho profissional'), 'crm');
    await user.clear(within(form).getByLabelText('Duração da consulta (minutos)'));
    await user.type(within(form).getByLabelText('Duração da consulta (minutos)'), '30');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('Já existe uma especialidade com esse nome.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      name: 'Cardiologia',
      council: 'CRM',
      appointmentDurationMin: 30,
    });
  });

  it('asks before deactivating and sends the change only when confirmed', async () => {
    const { calls } = serve({
      '/api/admin/specialties': () => ({ status: 200, body: page([specialty(1)]) }),
      '/api/admin/specialties/spec-1': () => ({ status: 200, body: specialty(1, { isActive: false }) }),
    });
    const { user } = renderApp('/admin/configuracoes/especialidades');
    const toggle = await screen.findByRole('switch', { name: 'Especialidade 1 ativo' });

    await user.click(toggle);
    const dialog = await screen.findByRole('dialog', { name: 'Desativar Especialidade 1?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);

    await user.click(toggle);
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Desativar Especialidade 1?' })).getByRole('button', {
        name: 'Desativar',
      }),
    );

    await waitFor(() =>
      expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isActive: false }),
    );
  });

  it('checks unit hours and sends only the open days in minutes', async () => {
    const { calls } = serve({
      '/api/admin/units': (method) =>
        method === 'POST'
          ? {
              status: 201,
              body: {
                id: 'u1',
                name: 'Central',
                address: 'Rua A, 1',
                phone: '+5511333344444',
                isActive: true,
                hours: [],
              },
            }
          : { status: 200, body: page([]) },
    });
    const { user } = renderApp('/admin/configuracoes/unidades');
    await user.click((await screen.findAllByRole('button', { name: 'Nova unidade' }))[0]!);
    const form = await screen.findByRole('form', { name: 'Unidade' });

    await user.type(within(form).getByLabelText('Nome'), 'Unidade Central');
    await user.type(within(form).getByLabelText('Endereço'), 'Rua das Flores, 123');
    await user.type(within(form).getByLabelText('Telefone'), '(11) 3333-4444');
    await user.click(within(form).getByRole('switch', { name: 'Segunda' }));
    const opens = within(form).getByLabelText('Abre (Segunda)');
    const closes = within(form).getByLabelText('Fecha (Segunda)');
    await user.clear(closes);
    await user.type(closes, '0700');
    expect(closes).toHaveValue('07:00');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('O fechamento precisa ser depois da abertura.')).toBeInTheDocument();

    await user.clear(opens);
    await user.type(opens, '08:00');
    await user.clear(closes);
    await user.type(closes, '18:00');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
        name: 'Unidade Central',
        address: 'Rua das Flores, 123',
        phone: '(11) 3333-4444',
        hours: [{ weekday: 1, openMin: 480, closeMin: 1080 }],
      }),
    );
  });

  it('fills the unit form with the formatted phone and closing at midnight', async () => {
    const { calls } = serve({
      '/api/admin/units': () => ({
        status: 200,
        body: page([unit({ hours: [{ weekday: 1, openMin: 480, closeMin: 1440 }] })]),
      }),
      '/api/admin/units/u1': () => ({
        status: 409,
        body: { message: 'Nome em uso.', code: 'NAME_TAKEN' },
      }),
    });
    const { user } = renderApp('/admin/configuracoes/unidades');
    await user.click(await screen.findByRole('button', { name: 'Editar Central' }));
    const form = await screen.findByRole('form', { name: 'Unidade' });

    expect(within(form).getByLabelText('Telefone')).toHaveValue('(11) 3333-4444');
    expect(within(form).getByLabelText('Abre (Segunda)')).toHaveValue('08:00');
    expect(within(form).getByLabelText('Fecha (Segunda)')).toHaveValue('24:00');
    expect(within(form).getByRole('switch', { name: 'Terça' })).not.toBeChecked();

    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('Já existe um cadastro com esse nome.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toMatchObject({
      hours: [{ weekday: 1, openMin: 480, closeMin: 1440 }],
    });
  });

  it('keeps the policy within its ranges', async () => {
    const { calls } = serve({
      '/api/admin/policy': (method, body) =>
        method === 'PUT'
          ? { status: 200, body: { ...policy, ...(body as object) } }
          : { status: 200, body: policy },
    });
    const { user } = renderApp('/admin/configuracoes/politica');
    const reschedules = await screen.findByLabelText('Reagendamentos por agendamento');

    await user.clear(reschedules);
    await user.type(reschedules, '11');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Use de 0 a 10.')).toBeInTheDocument();

    await user.clear(reschedules);
    await user.type(reschedules, '3');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
        appointmentLateWindowHours: 24,
        examLateWindowHours: 2,
        maxReschedules: 3,
        bookingHorizonDays: 60,
        minLeadMinutes: 60,
      }),
    );
  });

  it('offers only active exam types not yet offered and edits an existing offer', async () => {
    const { calls } = serve({
      '/api/admin/units': () => ({ status: 200, body: page([unit()]) }),
      '/api/admin/exam-types': () => ({
        status: 200,
        body: page([
          examType('e1', 'Raio-X'),
          examType('e2', 'Tomografia', false),
          examType('e3', 'Ultrassom'),
        ]),
      }),
      '/api/admin/units/u1/exam-offers': () => ({
        status: 200,
        body: [{ examTypeId: 'e1', examTypeName: 'Raio-X', capacityPerSlot: 2, isActive: true }],
      }),
      '/api/admin/units/u1/exam-offers/e1': () => ({
        status: 409,
        body: { message: 'Inativo.', code: 'EXAM_TYPE_INACTIVE' },
      }),
    });
    const { user, router } = renderApp('/admin/configuracoes/ofertas');

    await screen.findByRole('option', { name: 'Central' });
    await user.selectOptions(screen.getByLabelText('Unidade'), 'u1');
    expect(router.state.location.search).toBe('?unidade=u1');
    expect(await screen.findByText('2 ao mesmo tempo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Oferecer exame' }));
    const create = await screen.findByRole('form', { name: 'Oferta' });
    const options = within(within(create).getByLabelText('Exame')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Escolha o exame', 'Ultrassom']);
    await user.click(within(create).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('form', { name: 'Oferta' })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Editar Raio-X' }));
    const edit = await screen.findByRole('form', { name: 'Oferta' });
    expect(within(edit).getByLabelText('Exame')).toHaveValue('Raio-X');
    const capacity = within(edit).getByLabelText('Exames ao mesmo tempo');
    await user.clear(capacity);
    await user.type(capacity, '3');
    await user.click(within(edit).getByRole('button', { name: 'Salvar' }));

    expect(
      await within(edit).findByText('Este tipo de exame está desativado. Ative-o antes de oferecê-lo.'),
    ).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({ capacityPerSlot: 3, isActive: true });
  });
});
