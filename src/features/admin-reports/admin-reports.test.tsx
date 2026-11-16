import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';
import type { AdminReport } from './reports-api';

const counts = {
  total: 40,
  pending: 3,
  confirmed: 8,
  awaitingRecord: 2,
  completed: 18,
  noShow: 2,
  cancelled: 6,
  expired: 1,
  lateCancellations: 2,
  cancelledBy: { patient: 4, doctor: 1, admin: 0, system: 1 },
};

const point = (start: string, completed: number) => ({
  start,
  total: completed + 4,
  pending: 1,
  confirmed: 1,
  awaitingRecord: 0,
  completed,
  noShow: 1,
  cancelled: 1,
  expired: 0,
});

function report(overrides: Partial<AdminReport> = {}): AdminReport {
  return {
    period: { from: '2026-10-17', to: '2026-11-15', granularity: 'day' },
    appointments: { ...counts, noShowRate: 0.1 },
    exams: {
      ...counts,
      total: 12,
      pending: 0,
      noShow: 0,
      expired: 0,
      completed: 7,
      lateCancellations: 1,
      cancelledBy: { patient: 2, doctor: 0, admin: 1, system: 0 },
    },
    series: [point('2026-11-14', 3), point('2026-11-15', 5)],
    topSpecialties: [
      { id: 's1', name: 'Cardiologia', total: 12 },
      { id: 's2', name: 'Dermatologia', total: 7 },
    ],
    topExamTypes: [{ id: 'e1', name: 'Hemograma', total: 9 }],
    ...overrides,
  };
}

const serve = (respond: (url: URL) => MockResponse) =>
  serveApi(['admin'], { '/api/admin/reports': (_method, _body, url) => respond(url) });

const lastQuery = (calls: ReturnType<typeof serve>['calls']) => {
  const url = calls.filter((call) => call.url.pathname === '/api/admin/reports').at(-1)?.url;
  return { from: url?.searchParams.get('from'), to: url?.searchParams.get('to') };
};

const section = async (name: string) => within(await screen.findByRole('region', { name }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-15T15:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('admin reports', () => {
  it('opens from the admin navigation and asks for the last 30 days', async () => {
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin');
    const nav = await screen.findAllByRole('link', { name: 'Relatórios' });

    await user.click(nav[0]!);

    expect(await screen.findByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/relatorios');
    expect(await screen.findByText('17/10/2026 a 15/11/2026')).toBeInTheDocument();
    expect(lastQuery(calls)).toEqual({ from: '2026-10-17', to: '2026-11-15' });
    expect(screen.getByRole('radio', { name: '30 dias' })).toBeChecked();
  });

  it('puts a preset in the URL and in the request', async () => {
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios');
    await section('Consultas');

    await user.click(screen.getByRole('radio', { name: '7 dias' }));

    await waitFor(() => expect(router.state.location.search).toBe('?de=2026-11-09&ate=2026-11-15'));
    await waitFor(() => expect(lastQuery(calls)).toEqual({ from: '2026-11-09', to: '2026-11-15' }));
    expect(screen.getByRole('radio', { name: '7 dias' })).toBeChecked();
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('takes the default period from the São Paulo calendar near midnight UTC', async () => {
    vi.setSystemTime(new Date('2026-11-16T01:30:00.000Z'));
    const { calls } = serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    await section('Consultas');

    expect(lastQuery(calls)).toEqual({ from: '2026-10-17', to: '2026-11-15' });
  });

  it('hides the previous period while the next one loads', async () => {
    const { fetchMock } = serve(() => ({ status: 200, body: report() }));
    const { user } = renderApp('/admin/relatorios');
    expect(await screen.findByText('17/10/2026 a 15/11/2026')).toBeInTheDocument();
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));

    await user.click(screen.getByRole('radio', { name: '90 dias' }));

    await waitFor(() => expect(screen.queryByText('17/10/2026 a 15/11/2026')).not.toBeInTheDocument());
    expect(screen.getByRole('region', { name: 'Consultas' })).toBeInTheDocument();
  });

  it('refuses a custom period that ends before it starts', async () => {
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios?de=2026-03-01&ate=2026-03-31');
    await section('Consultas');
    const requests = calls.length;
    const to = screen.getByLabelText('Até');

    await user.clear(to);
    await user.type(to, '2026-02-01');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(to).toHaveAccessibleDescription('A data final deve ser igual ou posterior à inicial.');
    expect(to).toHaveFocus();
    expect(router.state.location.search).toBe('?de=2026-03-01&ate=2026-03-31');
    expect(calls).toHaveLength(requests);
  });

  it('reads a custom period from the URL and applies a new one', async () => {
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios?de=2026-01-01&ate=2026-03-31');
    await section('Consultas');
    expect(lastQuery(calls)).toEqual({ from: '2026-01-01', to: '2026-03-31' });
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    const from = screen.getByLabelText('De');
    expect(from).toHaveValue('2026-01-01');

    await user.clear(from);
    await user.type(from, '2026-02-01');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => expect(router.state.location.search).toBe('?de=2026-02-01&ate=2026-03-31'));
    await waitFor(() => expect(lastQuery(calls)).toEqual({ from: '2026-02-01', to: '2026-03-31' }));
  });

  it('shows the API field error on the invalid date', async () => {
    serve(() => ({
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        fields: { to: 'O período tem no máximo 366 dias.' },
      },
    }));
    renderApp('/admin/relatorios?de=2024-01-01&ate=2026-01-01');

    const to = await screen.findByLabelText('Até');
    await waitFor(() => expect(to).toHaveAccessibleDescription('O período tem no máximo 366 dias.'));
    expect(to).toHaveAttribute('aria-invalid', 'true');
    expect(to).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'Consultas' })).not.toBeInTheDocument();
  });

  it('shows the tiles and the breakdown for each kind', async () => {
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    const appointments = await section('Consultas');
    expect(appointments.getAllByRole('term').map((item) => item.textContent)).toEqual([
      'Total',
      'Concluídos',
      'Cancelados',
      'Taxa de faltas',
      'Cancelamentos tardios',
    ]);
    expect(appointments.getAllByRole('definition').map((item) => item.textContent)).toEqual([
      '40',
      '18',
      '6',
      '10%',
      '2',
    ]);
    const statuses = within(appointments.getByRole('list', { name: 'Consultas: por situação' }));
    expect(statuses.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Pendente3',
      'Confirmado8',
      'Aguardando registro2',
      'Concluída18',
      'Não compareceu2',
      'Cancelada6',
      'Não confirmada1',
    ]);
    const authors = within(appointments.getByRole('list', { name: 'Consultas: cancelamentos por autor' }));
    expect(authors.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Paciente4',
      'Médico1',
      'Administrador0',
      'Sistema1',
    ]);

    const exams = await section('Exames');
    expect(exams.getAllByRole('term').map((item) => item.textContent)).not.toContain('Taxa de faltas');
    const examStatuses = within(exams.getByRole('list', { name: 'Exames: por situação' }));
    expect(examStatuses.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Confirmado8',
      'Aguardando registro2',
      'Concluída7',
      'Cancelada6',
    ]);
  });

  it.each([
    [0.125, '12,5%'],
    [null, '—'],
  ])('formats the no-show rate %s', async (noShowRate, text) => {
    serve(() => ({ status: 200, body: report({ appointments: { ...counts, noShowRate } }) }));
    renderApp('/admin/relatorios');

    const appointments = await section('Consultas');
    expect(appointments.getAllByRole('definition')[3]).toHaveTextContent(text);
  });

  it('offers the series as a table', async () => {
    serve(() => ({ status: 200, body: report() }));
    const { user } = renderApp('/admin/relatorios');
    const chart = await section('Agendamentos por dia');
    expect(
      chart.getByRole('img', {
        name: 'Agendamentos por dia. 2 intervalos; Concluídos: 8; Em aberto: 4; Não realizados: 4; maior total: 9 em 15/11/2026.',
      }),
    ).toBeInTheDocument();
    expect(chart.queryByRole('table')).not.toBeInTheDocument();

    await user.click(chart.getByRole('button', { name: 'Ver tabela' }));

    const table = chart.getByRole('table', { name: 'Agendamentos por dia' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Dia', 'Concluídos', 'Em aberto', 'Não realizados', 'Total']);
    expect(
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(['14/11/20263227', '15/11/20265229']);
    expect(chart.getByRole('button', { name: 'Ocultar tabela' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('labels weekly intervals', async () => {
    serve(() => ({
      status: 200,
      body: report({ period: { from: '2025-11-16', to: '2026-11-15', granularity: 'week' } }),
    }));
    const { user } = renderApp('/admin/relatorios?de=2025-11-16&ate=2026-11-15');
    const chart = await section('Agendamentos por semana');

    await user.click(chart.getByRole('button', { name: 'Ver tabela' }));

    expect(chart.getByRole('rowheader', { name: 'Semana de 14/11/2026' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '12 meses' })).toBeChecked();
  });

  it('lists the most requested specialties and exam types', async () => {
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    const specialties = await section('Especialidades mais procuradas');
    expect(specialties.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Cardiologia12',
      'Dermatologia7',
    ]);
    const exams = await section('Exames mais procurados');
    expect(exams.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Hemograma9']);
  });

  it('shows the empty state for a period without bookings', async () => {
    const empty = { ...counts, total: 0, completed: 0, cancelled: 0 };
    serve(() => ({
      status: 200,
      body: report({
        appointments: { ...empty, noShowRate: null },
        exams: empty,
        topSpecialties: [],
        topExamTypes: [],
      }),
    }));
    renderApp('/admin/relatorios');

    expect(await screen.findByText('Nenhum agendamento no período')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Consultas' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '30 dias' })).toBeInTheDocument();
  });

  it('shows the error and loads again on retry', async () => {
    let available = false;
    serve(() => (available ? { status: 200, body: report() } : { status: 500 }));
    const { user } = renderApp('/admin/relatorios');
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' });
    available = true;

    await user.click(retry);

    expect(await section('Consultas')).toBeTruthy();
  });
});
