import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminReport, emptyReport, reportCounts } from '@/test/admin-report';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';

const counts = { patients: 1234, doctors: 61, appointmentsToday: 24 };

const CURRENT_FROM = '2026-10-17';

const previousReport = adminReport({ appointments: { ...reportCounts, completed: 10, noShowRate: 0.2 } });

interface Responders {
  report?: (url: URL) => MockResponse;
  home?: () => MockResponse;
}

const serve = ({ report, home }: Responders = {}) =>
  serveApi(['admin'], {
    '/api/admin/home': () => home?.() ?? { status: 200, body: counts },
    '/api/admin/reports': (_method, _body, url) =>
      report?.(url) ??
      (url.searchParams.get('from') === CURRENT_FROM || url.searchParams.get('from') === '2026-11-09'
        ? { status: 200, body: adminReport() }
        : { status: 200, body: previousReport }),
  });

const reportQueries = (calls: ReturnType<typeof serve>['calls']) =>
  calls
    .filter((call) => call.url.pathname === '/api/admin/reports')
    .map(({ url }) => `${url.searchParams.get('from')}|${url.searchParams.get('to')}`);

const tile = async (name: string) => within(await screen.findByRole('region', { name }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-15T15:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('admin panel', () => {
  it('shows the last 30 days against the 30 days before', async () => {
    const { calls } = serve();
    renderApp('/admin');

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByText('Visão geral da clínica · 17/10/2026 a 15/11/2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true');

    const done = await tile('Realizados');
    expect(await done.findByText('25')).toBeInTheDocument();
    expect(await done.findByText('+47,1%')).toBeInTheDocument();
    expect(done.getByText('vs. 30 dias anteriores')).toBeInTheDocument();
    const attendance = await tile('Comparecimento');
    expect(attendance.getByText('92,6%')).toBeInTheDocument();
    expect(attendance.getByText('+3,1 p.p.')).toBeInTheDocument();
    const cancelled = await tile('Cancelamentos');
    expect(cancelled.getByText('25%')).toBeInTheDocument();
    expect(cancelled.getByText('0 p.p.')).toBeInTheDocument();
    expect(reportQueries(calls)).toEqual(
      expect.arrayContaining(['2026-10-17|2026-11-15', '2026-09-17|2026-10-16']),
    );
  });

  it('switches the period from the segmented control', async () => {
    const { calls } = serve();
    const { user, router } = renderApp('/admin');
    await tile('Realizados');

    await user.click(screen.getByRole('button', { name: '7 dias' }));

    await waitFor(() => expect(router.state.location.search).toBe('?periodo=7'));
    expect(router.state.historyAction).toBe('REPLACE');
    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Visão geral da clínica · 09/11/2026 a 15/11/2026')).toBeInTheDocument();
    await waitFor(() =>
      expect(reportQueries(calls)).toEqual(
        expect.arrayContaining(['2026-11-09|2026-11-15', '2026-11-02|2026-11-08']),
      ),
    );
  });

  it('compares this month with the same days of the month before', async () => {
    const { calls } = serve({ report: () => ({ status: 200, body: adminReport() }) });
    renderApp('/admin?periodo=mes');

    await waitFor(() =>
      expect(reportQueries(calls)).toEqual(
        expect.arrayContaining(['2026-11-01|2026-11-15', '2026-10-01|2026-10-15']),
      ),
    );
    expect(await (await tile('Comparecimento')).findByText('vs. outubro')).toBeInTheDocument();
  });

  it('ends the month before on its last day when it is shorter', async () => {
    vi.setSystemTime(new Date('2026-03-31T15:00:00.000Z'));
    const { calls } = serve({ report: () => ({ status: 200, body: adminReport() }) });
    renderApp('/admin?periodo=mes');

    await waitFor(() =>
      expect(reportQueries(calls)).toEqual(
        expect.arrayContaining(['2026-03-01|2026-03-31', '2026-02-01|2026-02-28']),
      ),
    );
    expect(await (await tile('Realizados')).findByText('vs. fevereiro')).toBeInTheDocument();
  });

  it('draws the rate trends without the days that had no bookings', async () => {
    const quiet = {
      start: '2026-11-13',
      total: 0,
      pending: 0,
      confirmed: 0,
      awaitingRecord: 0,
      completed: 0,
      noShow: 0,
      cancelled: 0,
      expired: 0,
    };
    serve({
      report: () => ({ status: 200, body: adminReport({ series: [quiet, ...adminReport().series] }) }),
    });
    renderApp('/admin');

    const attendance = await screen.findByRole('region', { name: 'Comparecimento' });
    await screen.findByRole('region', { name: 'Volume de agendamentos' });
    const line = attendance.querySelector('path[fill="none"]')?.getAttribute('d') ?? '';
    expect(line.match(/[MC]/g)).toEqual(['M', 'C']);
  });

  it('shows the volume chart, the status split and the most requested lists', async () => {
    serve();
    renderApp('/admin');

    const volume = within(await screen.findByRole('region', { name: 'Volume de agendamentos' }));
    expect(volume.getByText('52')).toBeInTheDocument();
    expect(volume.getByText('26')).toBeInTheDocument();
    expect(
      volume.getByRole('img', {
        name: 'Agendamentos por dia. 2 intervalos; Realizados: 8; Cancelados: 2; Faltas: 2; maior total: 7 em 15/11/2026.',
      }),
    ).toBeInTheDocument();

    const status = within(screen.getByRole('region', { name: 'Situação dos agendamentos' }));
    expect(
      status.getByRole('img', { name: 'Realizados: 48,1%, Cancelados: 25%, Faltas: 3,8%, Em aberto: 44,2%' }),
    ).toBeInTheDocument();
    expect(status.getByText('48,1%', { selector: 'div[aria-hidden] > span' })).toBeInTheDocument();
    expect(status.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Realizados2548,1%',
      'Cancelados1325%',
      'Faltas23,8%',
      'Em aberto2344,2%',
    ]);

    const specialties = within(screen.getByRole('region', { name: 'Especialidades mais procuradas' }));
    expect(specialties.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Cardiologia12',
      'Dermatologia7',
    ]);
    const exams = within(screen.getByRole('region', { name: 'Exames mais procurados' }));
    expect(exams.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Hemograma9']);
  });

  it('shows the appointments of today and the active accounts', async () => {
    serve();
    renderApp('/admin');

    const today = await tile('Consultas hoje');
    expect(await today.findByText('24')).toBeInTheDocument();
    expect(today.getByText('1.234 pacientes e 61 médicos ativos')).toBeInTheDocument();
  });

  it('keeps the panel when the counts of today fail', async () => {
    serve({ home: () => ({ status: 500 }) });
    renderApp('/admin');

    const today = await tile('Consultas hoje');
    expect(await today.findByText('Não foi possível carregar.')).toBeInTheDocument();
    expect(today.getByText('—')).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Volume de agendamentos' })).toBeInTheDocument();
  });

  it('leaves out the deltas when the period before has no bookings', async () => {
    serve({
      report: (url) => ({
        status: 200,
        body: url.searchParams.get('from') === CURRENT_FROM ? adminReport() : emptyReport(),
      }),
    });
    renderApp('/admin');

    const done = await tile('Realizados');
    expect(await done.findByText('25')).toBeInTheDocument();
    await screen.findByRole('region', { name: 'Volume de agendamentos' });
    expect(done.queryByText(/%$/)).not.toBeInTheDocument();
    expect(done.queryByText('vs. 30 dias anteriores')).not.toBeInTheDocument();
  });

  it('marks the tiles as busy while the report loads', async () => {
    const { fetchMock } = serve();
    fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));
    renderApp('/admin', { signedInAs: ['admin'] });

    expect(await screen.findByRole('region', { name: 'Realizados' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('region', { name: 'Volume de agendamentos' })).not.toBeInTheDocument();
  });

  it('shows the empty state for a period without bookings', async () => {
    serve({ report: () => ({ status: 200, body: emptyReport() }) });
    renderApp('/admin');

    expect(await screen.findByText('Nenhum agendamento no período')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Volume de agendamentos' })).not.toBeInTheDocument();
  });

  it('shows the error and loads the report again on retry', async () => {
    let available = false;
    serve({ report: () => (available ? { status: 200, body: adminReport() } : { status: 500 }) });
    const { user } = renderApp('/admin');
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' });
    expect(screen.getByText('Algo deu errado. Tente de novo em instantes.')).toBeInTheDocument();
    available = true;

    await user.click(retry);

    expect(await screen.findByRole('region', { name: 'Volume de agendamentos' })).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado. Tente de novo em instantes.')).not.toBeInTheDocument();
  });
});
