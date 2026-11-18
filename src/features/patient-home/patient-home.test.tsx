import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PatientBooking, UserNotification } from '@lib/api/models';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';
import type { PatientHome, ResultSummary } from './patient-home-api';

const FUTURE = '2030-07-19T18:30:00.000Z';
const HOUR_MS = 3_600_000;

const booking = (id: string, overrides: Partial<PatientBooking> = {}): PatientBooking => ({
  id,
  kind: 'appointment',
  status: 'confirmed',
  startsAt: FUTURE,
  endsAt: '2030-07-19T19:00:00.000Z',
  notes: null,
  visitType: 'routine',
  doctor: { id: 'd1', fullName: 'Dr. João Silveira' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  examType: null,
  publicCode: null,
  unit: { id: 'u1', name: 'Hospital Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
  actions: {
    canCancel: true,
    lateCancellation: false,
    cancelBlockedReason: null,
    canReschedule: true,
    rescheduleBlockedReason: null,
    reschedulesLeft: 2,
  },
  cancellation: null,
  hasResult: false,
  ...overrides,
});

const notification = (overrides: Partial<UserNotification> = {}): UserNotification => ({
  id: 'n1',
  type: 'appointment_confirmed',
  params: { startsAt: FUTURE },
  bookingId: 'b1',
  readAt: null,
  createdAt: new Date(Date.now() - 2 * HOUR_MS).toISOString(),
  ...overrides,
});

type Home = Omit<PatientHome, 'counts'>;

const homeBody = ({
  upcoming = [],
  lastNotification = null,
  metrics = { bloodPressure: null, weight: null },
}: Partial<Home> = {}): PatientHome => ({
  upcoming,
  counts: { upcoming: upcoming.length, past: 0 },
  lastNotification,
  metrics,
});

const result = (bookingId: string, name: string, summary: ResultSummary['summary']): ResultSummary => ({
  bookingId,
  examType: { id: `t-${bookingId}`, name, kind: summary ? 'lab' : 'imaging' },
  startsAt: '2026-11-04T11:00:00.000Z',
  issuedAt: '2026-11-06T19:20:00.000Z',
  amended: false,
  summary,
});

const resultsBody = (items: ResultSummary[] = []) => ({ items, page: 1, pageSize: 3, total: items.length });

const serve = (respond: () => MockResponse, results: ResultSummary[] = []) =>
  serveApi(['patient'], {
    '/api/patient/home': respond,
    '/api/patient/exam-results': () => ({ status: 200, body: resultsBody(results) }),
  });

const serveHome = (home?: Partial<Home>, results?: ResultSummary[]) =>
  serve(() => ({ status: 200, body: homeBody(home) }), results);

const banner = async () => within(await screen.findByRole('region', { name: 'Última notificação' }));

const later = async () => within(await screen.findByRole('region', { name: 'Depois disso' }));

describe('patient home', { timeout: 15_000 }, () => {
  it('shows the last notification with its relative time', async () => {
    serveHome({ lastNotification: notification() });
    renderApp('/paciente');

    const region = await banner();
    expect(region.getByText('Consulta confirmada')).toBeVisible();
    expect(region.getByText('Sua consulta de 19/07, 15:30 foi confirmada pelo médico.')).toBeVisible();
    expect(region.getByText('há 2 h')).toBeVisible();
    expect(region.getByText('(não lida)')).toBeInTheDocument();
  });

  it.each<[string, Partial<UserNotification>, string, string]>([
    [
      'a cancellation by the doctor',
      { type: 'appointment_cancelled', params: { startsAt: FUTURE, cancelledByRole: 'doctor' } },
      'Consulta cancelada',
      'A consulta de 19/07, 15:30 foi cancelada pelo médico.',
    ],
    [
      'a cancellation by the system',
      { type: 'appointment_cancelled', params: { startsAt: FUTURE, cancelledByRole: 'system' } },
      'Consulta cancelada',
      'A consulta de 19/07, 15:30 foi cancelada pelo sistema.',
    ],
    [
      'an expired request',
      { type: 'appointment_expired' },
      'Pedido não confirmado',
      'O pedido de consulta de 19/07, 15:30 não foi confirmado a tempo. Escolha outro horário.',
    ],
    [
      'an exam result',
      { type: 'exam_result_available', params: {} },
      'Resultado disponível',
      'O resultado do seu exame já pode ser consultado.',
    ],
  ])('writes the banner text for %s', async (_case, overrides, title, body) => {
    serveHome({ lastNotification: notification({ ...overrides, readAt: new Date().toISOString() }) });
    renderApp('/paciente');

    const region = await banner();
    expect(region.getByText(title)).toBeVisible();
    expect(region.getByText(body)).toBeVisible();
    expect(region.queryByText('(não lida)')).not.toBeInTheDocument();
  });

  it('opens the notification target and marks it as read', async () => {
    const { calls } = serveApi(['patient'], {
      '/api/patient/home': () => ({ status: 200, body: homeBody({ lastNotification: notification() }) }),
      '/api/notifications/n1/read': () => ({ status: 204 }),
    });
    const { user, router } = renderApp('/paciente');

    const link = (await banner()).getByRole('link', { name: /Consulta confirmada/ });
    expect(link).toHaveAttribute('href', '/paciente/agendamentos');
    await user.click(link);

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(
      calls.some((call) => call.method === 'POST' && call.url.pathname === '/api/notifications/n1/read'),
    ).toBe(true);
  });

  it('still opens the target when marking as read fails', async () => {
    serveApi(['patient'], {
      '/api/patient/home': () => ({
        status: 200,
        body: homeBody({ lastNotification: notification({ type: 'appointment_expired' }) }),
      }),
      '/api/notifications/n1/read': () => ({
        status: 500,
        body: { code: 'INTERNAL_ERROR', message: 'Falha ao marcar.' },
      }),
    });
    const { user, router } = renderApp('/paciente');

    await user.click((await banner()).getByRole('link', { name: /Pedido não confirmado/ }));

    await waitFor(() => expect(router.state.location.search).toBe('?aba=realizados'));
    expect(router.state.location.pathname).toBe('/paciente/agendamentos');
    expect(screen.queryByText('Falha ao marcar.')).not.toBeInTheDocument();
  });

  it('does not mark an already read notification again', async () => {
    const { calls } = serveHome({ lastNotification: notification({ readAt: new Date().toISOString() }) });
    const { user, router } = renderApp('/paciente');

    await user.click((await banner()).getByRole('link', { name: /Consulta confirmada/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('hides the banner when there is no notification', async () => {
    serveHome({ upcoming: [booking('b1')] });
    renderApp('/paciente');

    expect(await screen.findByRole('link', { name: /^Próximo compromisso/ })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Última notificação' })).not.toBeInTheDocument();
  });

  it('highlights the next confirmed booking and links to its details', async () => {
    serveHome({ upcoming: [booking('b0', { status: 'pending' }), booking('b1')] });
    renderApp('/paciente');

    const next = await screen.findByRole('link', {
      name: /^Próximo compromisso\s*Confirmado\s*Sex, 19\/07 · 15:30\s*Dr\. João Silveira · Rotina, ver detalhes$/,
    });
    expect(next).toHaveAttribute('href', '/paciente/agendamentos?id=b1');
    expect(within(next).getByText('Confirmado')).toBeVisible();
    expect(within(next).getByText('Dr. João Silveira · Rotina')).toBeVisible();
  });

  it.each([
    [
      'one pending request',
      [booking('b1', { status: 'pending' })],
      '1 pedido aguarda a confirmação do médico.',
    ],
    [
      'two pending requests',
      [booking('b1', { status: 'pending' }), booking('b2', { status: 'pending' })],
      '2 pedidos aguardam a confirmação do médico.',
    ],
    ['nothing booked', [], 'Agende uma consulta ou um exame.'],
  ])('explains the next booking with %s', async (_case, items, text) => {
    serveHome({ upcoming: items });
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Próximo compromisso' }));
    expect(region.getByText('Nenhum compromisso confirmado')).toBeVisible();
    expect(region.getByText(text)).toBeVisible();
  });

  it('lists what comes after the next booking with a link to everything', async () => {
    serveHome({
      upcoming: [
        booking('b1'),
        booking('b2', {
          kind: 'exam',
          status: 'pending',
          visitType: null,
          doctor: null,
          specialty: null,
          examType: { id: 'e1', name: 'Ultrassom' },
          unit: { id: 'u2', name: 'Lab. Central', address: 'Rua B, 2', phone: '+551133335555' },
        }),
      ],
    });
    renderApp('/paciente');

    const region = await later();
    const row = await region.findByRole('link', { name: /Ultrassom/ });
    expect(row).toHaveAttribute('href', '/paciente/agendamentos?id=b2');
    expect(within(row).getByText('15:30 · Exame · Lab. Central')).toBeVisible();
    expect(within(row).getByText('Pendente')).toBeVisible();
    expect(region.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/paciente/agendamentos');
  });

  it('says when nothing else is booked', async () => {
    serveHome({ upcoming: [booking('b1')] });
    renderApp('/paciente');

    expect(await (await later()).findByText('Nada mais agendado.')).toBeVisible();
  });

  it('marks the list as busy while it loads', async () => {
    const { fetchMock } = serveHome();
    fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));
    renderApp('/paciente', { signedInAs: ['patient'] });

    const region = await screen.findByRole('region', { name: 'Depois disso' });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the error and loads again on retry', async () => {
    let available = false;
    serve(() =>
      available ? { status: 200, body: homeBody({ upcoming: [booking('b1')] }) } : { status: 400 },
    );
    const { user } = renderApp('/paciente');

    const retry = await screen.findByRole('button', { name: 'Tentar de novo' });
    expect(screen.getAllByRole('alert').some((alert) => /\S/.test(alert.textContent ?? ''))).toBe(true);
    expect((await later()).getByText('Não foi possível carregar os agendamentos.')).toBeVisible();
    available = true;
    await user.click(retry);

    expect(await screen.findByRole('link', { name: /^Próximo compromisso/ })).toBeVisible();
  });

  it('shows the health measures as not recorded yet', async () => {
    serveHome();
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Minha saúde' }));
    expect(region.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Pressão arterial—Sem registro',
      'Peso—Sem registro',
    ]);
    expect(await region.findByText(/depois que o médico registrar suas consultas/)).toBeVisible();
  });

  it('shows the latest pressure and weight with when they were recorded', async () => {
    const ago = (hours: number) => new Date(Date.now() - hours * HOUR_MS).toISOString();
    const pressureAt = ago(72);
    serveHome({
      metrics: {
        bloodPressure: { systolic: 118, diastolic: 76, recordedAt: pressureAt },
        weight: { kg: 72.4, recordedAt: ago(240) },
      },
    });
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Minha saúde' }));
    const since = await region.findByText('há 3 dias');
    expect(since.tagName).toBe('TIME');
    expect(since).toHaveAttribute('datetime', pressureAt);
    const [pressure, weight] = region.getAllByRole('listitem');
    expect(pressure).toHaveTextContent('118/76 mmHg');
    expect(weight).toHaveTextContent('72,4 kg');
    expect(region.getByText('há 1 semana')).toBeVisible();
    expect(region.queryByText(/depois que o médico registrar suas consultas/)).not.toBeInTheDocument();
  });

  it('keeps a measure without a record when only the other one exists', async () => {
    serveHome({ metrics: { bloodPressure: null, weight: { kg: 80, recordedAt: new Date().toISOString() } } });
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Minha saúde' }));
    await region.findByText('agora');
    const [pressure, weight] = region.getAllByRole('listitem');
    expect(pressure).toHaveTextContent('—Sem registro');
    expect(weight).toHaveTextContent('80 kg');
  });

  it('lists the recent results with how many items are out of range', async () => {
    serveHome({}, [
      result('r1', 'Hemograma', { items: 8, outOfRange: 2, flagged: ['Hematócrito', 'Leucócitos'] }),
      result('r2', 'Glicemia', { items: 1, outOfRange: 1, flagged: ['Glicose'] }),
      result('r3', 'Colesterol', { items: 4, outOfRange: 0, flagged: [] }),
      result('r4', 'Raio-X', null),
    ]);
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Resultados recentes' }));
    const links = await region.findAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Hemograma04/11 · 2 itens fora da referência',
      'Glicemia04/11 · 1 item fora da referência',
      'Colesterol04/11 · dentro da referência',
      'Raio-X04/11 · laudo disponível',
    ]);
    expect(links[0]).toHaveAttribute('href', '/paciente/exames/r1/resultado');
  });

  it('shows the results error and loads them again on retry', async () => {
    let available = false;
    serveApi(['patient'], {
      '/api/patient/home': () => ({ status: 200, body: homeBody() }),
      '/api/patient/exam-results': () =>
        available
          ? {
              status: 200,
              body: resultsBody([result('r1', 'Hemograma', { items: 1, outOfRange: 0, flagged: [] })]),
            }
          : { status: 400 },
    });
    const { user } = renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Resultados recentes' }));
    const retry = await region.findByRole('button', { name: 'Tentar de novo' });
    available = true;
    await user.click(retry);

    expect(await region.findByRole('link', { name: /Hemograma/ })).toBeVisible();
  });

  it('says when no result is ready yet', async () => {
    serveHome();
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Resultados recentes' }));
    expect(await region.findByText('Os resultados aparecem aqui quando ficarem prontos.')).toBeVisible();
  });

  it.each([
    [/^Agendar consulta/, '/paciente/consultas/nova'],
    [/^Agendar exame/, '/paciente/exames/novo'],
  ])('links %s to %s', async (name, path) => {
    serveHome();
    renderApp('/paciente');

    const shortcuts = within(await screen.findByRole('navigation', { name: 'Agendar' }));
    expect(shortcuts.getByRole('link', { name })).toHaveAttribute('href', path);
  });
});
