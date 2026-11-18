import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { renderApp } from '@/test/render-app';
import { DESKTOP_QUERY } from '@hooks/useMediaQuery';
import { page, policy, serveSettings as serve } from './settings-fixtures';

const specialty = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `spec-${index}`,
  name: `Especialidade ${index}`,
  council: 'CRM',
  appointmentDurationMin: 30,
  isActive: true,
  ...overrides,
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

const row = (name: string, card?: string) =>
  within(card ? (document.getElementById(card) as HTMLElement) : document.body).getByRole('button', {
    name: new RegExp(`^${name}`),
  });

const findForm = (name: string) => screen.findByRole('form', { name });

const requestUrls = (fetchMock: ReturnType<typeof serve>['fetchMock']) =>
  fetchMock.mock.calls.map(([url]) => String(url instanceof Request ? url.url : url));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('admin settings', () => {
  it('shows every section on one page with details, statuses and pages per card', async () => {
    const { fetchMock } = serve({
      '/api/admin/specialties': () => ({
        status: 200,
        body: page([specialty(1), specialty(2, { isActive: false, council: 'CRN' })], 45),
      }),
      '/api/admin/units': () => ({ status: 200, body: page([unit()]) }),
    });
    const { user, router } = renderApp('/admin/configuracoes');

    expect(await screen.findByText('Especialidade 1')).toBeInTheDocument();
    expect(screen.getByText('CRN · consultas de 30 min')).toBeInTheDocument();
    expect(within(row('Especialidade 2')).getByText('Inativa')).toBeInTheDocument();
    expect(await screen.findByText('Rua A, 1 · sem horário definido')).toBeInTheDocument();
    for (const title of ['Unidades', 'Exames por unidade', 'Integrações', 'Agendamento', 'Tipos de exame']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Página 2' }));

    await waitFor(() => expect(requestUrls(fetchMock).some((url) => url.includes('page=2'))).toBe(true));
    expect(router.state.location.search).toBe('?pagina-especialidades=2');
  });

  it('reads the page of a card from the URL and moves back to the last page when it is past the end', async () => {
    const { fetchMock } = serve({
      '/api/admin/specialties': () => ({ status: 200, body: page([specialty(1)], 45) }),
    });
    const { router } = renderApp('/admin/configuracoes?pagina-especialidades=9');

    await waitFor(() => expect(router.state.location.search).toBe('?pagina-especialidades=3'));
    expect(requestUrls(fetchMock).some((url) => url.includes('page=9'))).toBe(true);
    await waitFor(() => expect(requestUrls(fetchMock).some((url) => url.includes('page=3'))).toBe(true));
  });

  it('focuses the card of a deep link and leaves unknown sections', async () => {
    serve({});
    const { router } = renderApp('/admin/configuracoes/exames');

    await waitFor(() => expect(document.getElementById('exames')).toHaveFocus());

    await router.navigate('/admin/configuracoes/desconhecida');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/configuracoes'));
  });

  it('scrolls to a deep linked card again once the cards above it have loaded', async () => {
    const unitLoaded: boolean[] = [];
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (this: Element) {
      if (this.id === 'exames')
        unitLoaded.push(screen.queryByText('Rua A, 1 · sem horário definido') !== null);
    });
    serve({ '/api/admin/units': () => ({ status: 200, body: page([unit()]) }) });
    renderApp('/admin/configuracoes/exames');

    await waitFor(() => expect(unitLoaded.at(-1)).toBe(true));
    expect(unitLoaded[0]).toBe(false);
  });

  it('shows an empty state for a list without items', async () => {
    serve({});
    renderApp('/admin/configuracoes');

    expect(await screen.findByText('Nenhum tipo de exame cadastrado.')).toBeInTheDocument();
    expect(screen.getByText('Escolha uma unidade para ver os exames que ela faz.')).toBeInTheDocument();
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
    const { user } = renderApp('/admin/configuracoes');
    await user.click(await screen.findByRole('button', { name: 'Adicionar tipo de exame' }));
    const form = await findForm('Tipo de exame');
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
    const { user } = renderApp('/admin/configuracoes');
    await user.click(await screen.findByRole('button', { name: 'Adicionar especialidade' }));
    const form = await findForm('Especialidade');

    expect(within(form).queryByRole('switch')).not.toBeInTheDocument();
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

  it('deactivates an item from its drawer and explains an item still in use', async () => {
    let saves = 0;
    const { calls } = serve({
      '/api/admin/specialties': () => ({ status: 200, body: page([specialty(1)]) }),
      '/api/admin/specialties/spec-1': () => {
        saves += 1;
        return saves === 1
          ? { status: 409, body: { message: 'Em uso.', code: 'IN_USE' } }
          : { status: 200, body: specialty(1, { isActive: false }) };
      },
    });
    const { user } = renderApp('/admin/configuracoes');
    await screen.findByText('Especialidade 1');
    await user.click(row('Especialidade 1'));
    const form = await findForm('Especialidade');
    const active = within(form).getByRole('switch', { name: 'Especialidade ativa' });

    expect(active).toBeChecked();
    await user.click(active);
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText(/Há agendamentos futuros ligados a este item/)).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      name: 'Especialidade 1',
      council: 'CRM',
      appointmentDurationMin: 30,
      isActive: false,
    });

    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Especialidade atualizada.')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('form', { name: 'Especialidade' })).not.toBeInTheDocument(),
    );
  });

  it('checks unit hours and sends only the open days in minutes', async () => {
    const { calls } = serve({
      '/api/admin/units': (method) =>
        method === 'POST' ? { status: 201, body: unit() } : { status: 200, body: page([]) },
    });
    const { user } = renderApp('/admin/configuracoes');
    await user.click(await screen.findByRole('button', { name: 'Adicionar unidade' }));
    const form = await findForm('Unidade');

    await user.type(within(form).getByLabelText('Nome'), 'Unidade Central');
    await user.type(within(form).getByLabelText('Endereço'), 'Rua das Flores, 123');
    await user.type(within(form).getByLabelText('Telefone'), '(11) 3333-4444');
    await user.click(within(form).getByRole('switch', { name: 'Segunda-feira' }));
    const opens = within(form).getByLabelText('Abre (Segunda-feira)');
    const closes = within(form).getByLabelText('Fecha (Segunda-feira)');
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
    const { user } = renderApp('/admin/configuracoes');
    await screen.findByText('Rua A, 1 · aberta 1 dia por semana');
    await user.click(row('Central'));
    const form = await findForm('Unidade');

    expect(within(form).getByLabelText('Telefone')).toHaveValue('(11) 3333-4444');
    expect(within(form).getByLabelText('Abre (Segunda-feira)')).toHaveValue('08:00');
    expect(within(form).getByLabelText('Fecha (Segunda-feira)')).toHaveValue('24:00');
    expect(within(form).getByRole('switch', { name: 'Terça-feira' })).not.toBeChecked();

    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('Já existe um cadastro com esse nome.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toMatchObject({
      hours: [{ weekday: 1, openMin: 480, closeMin: 1440 }],
    });
  });

  it('saves a changed policy from the bar above the navigation on the phone', async () => {
    const { calls } = serve({
      '/api/admin/policy': (method, body) =>
        method === 'PUT'
          ? { status: 200, body: { ...policy, ...(body as object) } }
          : { status: 200, body: policy },
    });
    const { user } = renderApp('/admin/configuracoes');
    await user.click(await screen.findByRole('button', { name: /^Reagendamentos 2 vezes/ }));

    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /^3 vezes/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Configurações salvas.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      appointmentLateWindowHours: 24,
      examLateWindowHours: 2,
      maxReschedules: 3,
      bookingHorizonDays: 60,
      minLeadMinutes: 60,
      maxActiveBookings: 5,
      maxActiveAppointments: 5,
      maxActiveExams: 5,
    });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument());
  });

  it('saves a changed policy from the page header on the desktop', async () => {
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    const { calls } = serve({
      '/api/admin/policy': (method, body) =>
        method === 'PUT'
          ? { status: 200, body: { ...policy, ...(body as object) } }
          : { status: 200, body: policy },
    });
    const { user } = renderApp('/admin/configuracoes');
    await user.click(await screen.findByRole('button', { name: /^Agenda aberta 60 dias/ }));
    await user.click(screen.getByRole('option', { name: /^90 dias/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));

    expect(await screen.findByText('Configurações salvas.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({ bookingHorizonDays: 90 });
    await waitFor(() => expect(document.getElementById('politica')).toHaveFocus());
    expect(screen.queryByRole('button', { name: 'Salvar configurações' })).not.toBeInTheDocument();
  });

  it('saves the active booking limits with every policy field', async () => {
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    const { calls } = serve({
      '/api/admin/policy': (method, body) =>
        method === 'PUT'
          ? { status: 200, body: { ...policy, ...(body as object) } }
          : { status: 200, body: { ...policy, maxActiveExams: 7 } },
    });
    const { user } = renderApp('/admin/configuracoes');
    await user.click(
      await screen.findByRole('button', { name: /^Agendamentos ativos por paciente 5 agendamentos/ }),
    );
    await user.click(screen.getByRole('option', { name: /^10 agendamentos/ }));
    await user.click(screen.getByRole('button', { name: /^Consultas ativas por paciente 5 consultas/ }));
    await user.click(screen.getByRole('option', { name: /^1 consulta$/ }));
    await user.click(screen.getByRole('button', { name: /^Exames ativos por paciente 7 exames/ }));
    expect(screen.getByRole('option', { name: /^7 exames/ })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /^50 exames/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));

    expect(await screen.findByText('Configurações salvas.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      appointmentLateWindowHours: 24,
      examLateWindowHours: 2,
      maxReschedules: 2,
      bookingHorizonDays: 60,
      minLeadMinutes: 60,
      maxActiveBookings: 10,
      maxActiveAppointments: 1,
      maxActiveExams: 50,
    });
  });

  it('keeps the changes and the save bar when saving the policy fails', async () => {
    serve({
      '/api/admin/policy': (method) =>
        method === 'PUT'
          ? { status: 503, body: { message: 'Indisponível.', code: 'SERVICE_UNAVAILABLE' } }
          : { status: 200, body: policy },
    });
    const { user } = renderApp('/admin/configuracoes');
    await user.click(await screen.findByRole('button', { name: /^Reagendamentos 2 vezes/ }));
    await user.click(screen.getByRole('option', { name: /^3 vezes/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await within(screen.getByRole('form', { name: 'Agendamento' })).findByRole('alert'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Reagendamentos 3 vezes/ })).toBeInTheDocument();
  });

  it('explains an item that no longer exists when saving it', async () => {
    serve({
      '/api/admin/specialties': () => ({ status: 200, body: page([specialty(1)]) }),
      '/api/admin/specialties/spec-1': () => ({
        status: 404,
        body: { message: 'Specialty not found.', code: 'NOT_FOUND' },
      }),
    });
    const { user } = renderApp('/admin/configuracoes');
    await screen.findByText('Especialidade 1');
    await user.click(row('Especialidade 1'));
    const form = await findForm('Especialidade');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(await within(form).findByText('Este item não existe mais. Atualize a lista.')).toBeInTheDocument();
  });

  it('opens the offers of the unit in the URL', async () => {
    serve({
      '/api/admin/units': () => ({ status: 200, body: page([unit()]) }),
      '/api/admin/units/u1/exam-offers': () => ({
        status: 200,
        body: [{ examTypeId: 'e1', examTypeName: 'Raio-X', capacityPerSlot: 2, isActive: false }],
      }),
    });
    renderApp('/admin/configuracoes/ofertas?unidade=u1');

    expect(await screen.findByText('2 ao mesmo tempo')).toBeInTheDocument();
    expect(within(row('Raio-X', 'ofertas')).getByText('Inativo')).toBeInTheDocument();
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
    const { user, router } = renderApp('/admin/configuracoes');

    await user.click(await screen.findByRole('button', { name: /^Unidade Escolha a unidade/ }));
    await user.click(await screen.findByRole('option', { name: /^Central/ }));
    expect(router.state.location.search).toBe('?unidade=u1');
    expect(await screen.findByText('2 ao mesmo tempo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Oferecer exame' }));
    const create = await findForm('Oferta');
    await user.click(within(create).getByRole('button', { name: /^Exame Escolha o exame/ }));
    const options = within(await screen.findByRole('listbox', { name: 'Exame' })).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAccessibleName(/^Ultrassom/);
    await user.keyboard('{Escape}');
    await user.click(within(create).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('form', { name: 'Oferta' })).not.toBeInTheDocument());

    await user.click(row('Raio-X', 'ofertas'));
    const edit = await findForm('Oferta');
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
