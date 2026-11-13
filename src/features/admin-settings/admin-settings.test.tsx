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
  });

  it('shows an empty state for a list without items', async () => {
    serve({ '/api/admin/exam-types': () => ({ status: 200, body: page([]) }) });
    renderApp('/admin/configuracoes/exames');

    expect(await screen.findByText('Nenhum tipo de exame cadastrado')).toBeInTheDocument();
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
    await user.click(within(form).getByRole('switch', { name: 'Segunda: fechada' }));
    const opens = within(form).getByLabelText('Abre (Segunda)');
    const closes = within(form).getByLabelText('Fecha (Segunda)');
    await user.clear(closes);
    await user.type(closes, '07:00');
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

  it('explains when an exam type cannot be offered because it is inactive', async () => {
    serve({
      '/api/admin/units': () => ({
        status: 200,
        body: page([
          {
            id: 'u1',
            name: 'Central',
            address: 'Rua A, 1',
            phone: '+551133334444',
            isActive: true,
            hours: [],
          },
        ]),
      }),
      '/api/admin/exam-types': () => ({
        status: 200,
        body: page([
          {
            id: 'e1',
            code: 'raio_x',
            name: 'Raio-X',
            kind: 'imaging',
            durationMin: 15,
            preparationNotes: null,
            isActive: false,
          },
        ]),
      }),
      '/api/admin/units/u1/exam-offers': () => ({ status: 200, body: [] }),
      '/api/admin/units/u1/exam-offers/e1': () => ({
        status: 409,
        body: { message: 'Inativo.', code: 'EXAM_TYPE_INACTIVE' },
      }),
    });
    const { user } = renderApp('/admin/configuracoes/ofertas');

    await screen.findByRole('option', { name: 'Central' });
    await user.selectOptions(screen.getByLabelText('Unidade'), 'u1');
    expect(await screen.findByText('Nenhum exame oferecido nesta unidade')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Oferecer exame' })[0]!);
    const form = await screen.findByRole('form', { name: 'Oferta' });
    await user.selectOptions(within(form).getByLabelText('Exame'), 'e1');
    await user.click(within(form).getByRole('button', { name: 'Salvar' }));

    expect(
      await within(form).findByText('Este tipo de exame está desativado. Ative-o antes de oferecê-lo.'),
    ).toBeInTheDocument();
  });
});
