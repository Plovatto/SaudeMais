import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminReport as report, emptyReport, reportCounts as counts } from '@/test/admin-report';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';

const serve = (respond: (url: URL) => MockResponse, exportFile?: (url: URL) => MockResponse) =>
  serveApi(['admin'], {
    '/api/admin/reports': (_method, _body, url) => respond(url),
    '/api/admin/reports/export': (_method, _body, url) => exportFile?.(url),
  });

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
    expect(
      calls.some(
        ({ url }) =>
          url.pathname === '/api/admin/reports' &&
          url.searchParams.get('from') === '2026-10-17' &&
          url.searchParams.get('to') === '2026-11-15',
      ),
    ).toBe(true);
    expect(screen.getByRole('radio', { name: '30 dias' })).toBeChecked();
  });

  it('puts a preset in the URL and in the request', async () => {
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios');
    await section('Agendamentos por dia');

    await user.click(screen.getByRole('radio', { name: '7 dias' }));

    await waitFor(() => expect(router.state.location.search).toBe('?periodo=7'));
    await waitFor(() => expect(lastQuery(calls)).toEqual({ from: '2026-11-09', to: '2026-11-15' }));
    expect(screen.getByRole('radio', { name: '7 dias' })).toBeChecked();
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it.each([
    ['Este mês', '?periodo=mes'],
    ['Hoje', '?periodo=hoje'],
  ])('keeps %s chosen on the first day of the month', async (name, search) => {
    vi.setSystemTime(new Date('2026-11-01T15:00:00.000Z'));
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios');
    await section('Agendamentos por dia');

    await user.click(screen.getByRole('radio', { name }));

    await waitFor(() => expect(router.state.location.search).toBe(search));
    expect(screen.getByRole('radio', { name })).toBeChecked();
    await waitFor(() => expect(lastQuery(calls)).toEqual({ from: '2026-11-01', to: '2026-11-01' }));
  });

  it('prefers the calendar preset for a matching custom period', async () => {
    vi.setSystemTime(new Date('2026-11-07T15:00:00.000Z'));
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios?de=2026-11-01&ate=2026-11-07');
    await section('Agendamentos por dia');

    expect(screen.getByRole('radio', { name: 'Este mês' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '7 dias' })).not.toBeChecked();
  });

  it('takes the default period from the São Paulo calendar near midnight UTC', async () => {
    vi.setSystemTime(new Date('2026-11-16T01:30:00.000Z'));
    const { calls } = serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    await section('Agendamentos por dia');

    expect(lastQuery(calls)).toEqual({ from: '2026-10-17', to: '2026-11-15' });
  });

  it('dims the previous period while the next one loads', async () => {
    const { fetchMock } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios');
    await section('Agendamentos por dia');
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));

    await user.click(screen.getByRole('radio', { name: 'Mês passado' }));

    await waitFor(() => expect(router.state.location.search).toBe('?periodo=mes-passado'));
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Agendamentos por dia' }).closest('[aria-busy]'),
      ).toHaveAttribute('aria-busy', 'true'),
    );
    expect(screen.getByRole('button', { name: 'PDF' })).toBeDisabled();
  });

  it('refuses a custom period that ends before it starts', async () => {
    const { calls } = serve(() => ({ status: 200, body: report() }));
    const { user, router } = renderApp('/admin/relatorios?de=2026-03-01&ate=2026-03-31');
    await section('Agendamentos por dia');
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
    await section('Agendamentos por dia');
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
    expect(screen.queryByRole('region', { name: 'Agendamentos por dia' })).not.toBeInTheDocument();
  });

  it('shows the summary tiles for consultations and exams together', async () => {
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    for (const [name, value] of [
      ['Agendamentos', '52'],
      ['Realizados', '25'],
      ['Cancelados', '13'],
      ['Faltas', '2'],
      ['Comparecimento', '92,6%'],
    ] as const) {
      expect(await section(name)).toBeTruthy();
      expect(screen.getByRole('region', { name })).toHaveTextContent(`${name}${value}`);
    }
  });

  it('shows a dash for the attendance without completed or missed bookings', async () => {
    serve(() => ({
      status: 200,
      body: report({
        appointments: { ...counts, completed: 0, noShow: 0, noShowRate: null },
        exams: { ...counts, completed: 0, noShow: 0 },
      }),
    }));
    renderApp('/admin/relatorios');

    expect(await section('Comparecimento')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Comparecimento' })).toHaveTextContent('Comparecimento—');
  });

  it('lists the series with the period and the totals', async () => {
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    const series = await section('Agendamentos por dia');
    expect(series.getByText('17/10/2026 a 15/11/2026')).toBeInTheDocument();
    const table = series.getByRole('table', { name: 'Agendamentos por dia' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Dia', 'Total', 'Realizados', 'Em aberto', 'Cancelados', 'Faltas']);
    expect(
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(['14/11/202673211', '15/11/202695211', 'Total168422']);
  });

  it('labels weekly intervals', async () => {
    serve(() => ({
      status: 200,
      body: report({ period: { from: '2025-11-16', to: '2026-11-15', granularity: 'week' } }),
    }));
    renderApp('/admin/relatorios?de=2025-11-16&ate=2026-11-15');

    const series = await section('Agendamentos por semana');
    expect(series.getByRole('rowheader', { name: 'Semana de 14/11/2026' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '12 meses' })).toBeChecked();
  });

  it('breaks the bookings down by status and by who cancelled', async () => {
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    const rows = (name: string) =>
      within(screen.getByRole('table', { name }))
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent);
    await section('Por situação');
    expect(rows('Agendamentos por situação')).toEqual([
      'Pendente3—',
      'Confirmado88',
      'Aguardando registro22',
      'Concluída187',
      'Não compareceu2—',
      'Cancelada66',
      'Não confirmada1—',
      'Total4012',
    ]);
    expect(rows('Cancelamentos por autor')).toEqual([
      'Paciente42',
      'Médico10',
      'Administrador01',
      'Sistema10',
      'Total66',
    ]);
    expect(screen.getByText('Cancelamentos tardios: 2 consultas e 1 exame.')).toBeInTheDocument();
  });

  it('lists the most requested specialties and exam types', async () => {
    serve(() => ({ status: 200, body: report() }));
    renderApp('/admin/relatorios');

    const specialties = await section('Especialidades mais procuradas');
    expect(
      specialties
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(['Cardiologia12', 'Dermatologia7']);
    const exams = await section('Exames mais procurados');
    expect(
      exams
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(['Hemograma9']);
  });

  it.each([
    ['Excel', 'xlsx'],
    ['PDF', 'pdf'],
  ])('exports the period in %s', async (label, format) => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:relatorio');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { calls } = serve(
      () => ({ status: 200, body: report() }),
      () => ({ status: 200, body: 'file' }),
    );
    const { user } = renderApp('/admin/relatorios');
    await section('Agendamentos por dia');

    await user.click(screen.getByRole('button', { name: label }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(
      `relatorio_2026-10-17_a_2026-11-15.${format}`,
    );
    const call = calls.find(({ url }) => url.pathname === '/api/admin/reports/export');
    expect(Object.fromEntries(call?.url.searchParams ?? [])).toEqual({
      from: '2026-10-17',
      to: '2026-11-15',
      format,
    });
    vi.restoreAllMocks();
  });

  it('announces the file being generated', async () => {
    const { fetchMock } = serve(() => ({ status: 200, body: report() }));
    const { user } = renderApp('/admin/relatorios');
    await section('Agendamentos por dia');
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));

    await user.click(screen.getByRole('button', { name: 'Excel' }));

    expect(await screen.findByRole('button', { name: 'Gerando…, Excel' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'PDF' })).toBeDisabled();
  });

  it('warns when the file cannot be generated', async () => {
    serve(
      () => ({ status: 200, body: report() }),
      () => ({ status: 500 }),
    );
    const { user } = renderApp('/admin/relatorios');
    await section('Agendamentos por dia');

    await user.click(screen.getByRole('button', { name: 'PDF' }));

    expect(await screen.findByText('Algo deu errado. Tente de novo em instantes.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeEnabled();
  });

  it('shows the empty state for a period without bookings', async () => {
    serve(() => ({ status: 200, body: emptyReport() }));
    renderApp('/admin/relatorios');

    expect(await screen.findByText('Nenhum agendamento no período')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Agendamentos por dia' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '30 dias' })).toBeInTheDocument();
  });

  it('shows the error and loads again on retry', async () => {
    let available = false;
    serve(() => (available ? { status: 200, body: report() } : { status: 500 }));
    const { user } = renderApp('/admin/relatorios');
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' });
    available = true;

    await user.click(retry);

    expect(await section('Agendamentos por dia')).toBeTruthy();
  });
});
