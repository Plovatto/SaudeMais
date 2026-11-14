import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PatientBooking, UserNotification } from '@lib/api/models';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';

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
  actions: { canCancel: true, lateCancellation: false, cancelBlockedReason: null },
  cancellation: null,
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

interface Home {
  upcoming: PatientBooking[];
  lastNotification: UserNotification | null;
}

const homeBody = ({ upcoming = [], lastNotification = null }: Partial<Home> = {}) => ({
  upcoming,
  counts: { upcoming: upcoming.length, past: 0 },
  lastNotification,
});

const serve = (respond: () => MockResponse) => serveApi(['patient'], { '/api/patient/home': respond });

const serveHome = (home?: Partial<Home>) => serve(() => ({ status: 200, body: homeBody(home) }));

const banner = async () => within(await screen.findByRole('region', { name: 'Última notificação' }));

const upcoming = async () => within(await screen.findByRole('region', { name: 'Próximos agendamentos' }));

describe('patient home', { timeout: 15_000 }, () => {
  it('shows the last notification with its relative time', async () => {
    serveHome({ lastNotification: notification() });
    renderApp('/paciente');

    const region = await banner();
    expect(region.getByText('Consulta confirmada!')).toBeVisible();
    expect(region.getByText('Sua consulta de 19/07/2030, 15:30 foi confirmada pelo médico.')).toBeVisible();
    expect(region.getByText('há 2 h')).toBeVisible();
    expect(region.getByText('(não lida)')).toBeInTheDocument();
  });

  it.each<[string, Partial<UserNotification>, string, string]>([
    [
      'a cancellation by the doctor',
      { type: 'appointment_cancelled', params: { startsAt: FUTURE, cancelledByRole: 'doctor' } },
      'Consulta cancelada',
      'A consulta de 19/07/2030, 15:30 foi cancelada pelo médico.',
    ],
    [
      'a cancellation by the system',
      { type: 'appointment_cancelled', params: { startsAt: FUTURE, cancelledByRole: 'system' } },
      'Consulta cancelada',
      'A consulta de 19/07/2030, 15:30 foi cancelada pelo sistema.',
    ],
    [
      'an expired request',
      { type: 'appointment_expired' },
      'Pedido não confirmado',
      'O pedido de consulta de 19/07/2030, 15:30 não foi confirmado a tempo. Escolha outro horário.',
    ],
    [
      'an exam result',
      { type: 'exam_result_available', params: {} },
      'Resultado de exame disponível',
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

    const link = (await banner()).getByRole('link', { name: /Consulta confirmada!/ });
    expect(link).toHaveAttribute('href', '/paciente/agendamentos');
    await user.click(link);

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(
      calls.some((call) => call.method === 'POST' && call.url.pathname === '/api/notifications/n1/read'),
    ).toBe(true);
  });

  it('still opens the target when a demo account cannot mark it as read', async () => {
    serveApi(['patient'], {
      '/api/patient/home': () => ({
        status: 200,
        body: homeBody({ lastNotification: notification({ type: 'appointment_expired' }) }),
      }),
      '/api/notifications/n1/read': () => ({
        status: 403,
        body: { code: 'PROTECTED_ACCOUNT', message: 'Conta de demonstração.' },
      }),
    });
    const { user, router } = renderApp('/paciente');

    await user.click((await banner()).getByRole('link', { name: /Pedido não confirmado/ }));

    await waitFor(() => expect(router.state.location.search).toBe('?aba=realizados'));
    expect(router.state.location.pathname).toBe('/paciente/agendamentos');
    expect(screen.queryByText('Conta de demonstração.')).not.toBeInTheDocument();
  });

  it('does not mark an already read notification again', async () => {
    const { calls } = serveHome({ lastNotification: notification({ readAt: new Date().toISOString() }) });
    const { user, router } = renderApp('/paciente');

    await user.click((await banner()).getByRole('link', { name: /Consulta confirmada!/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('hides the banner when there is no notification', async () => {
    serveHome({ upcoming: [booking('b1')] });
    renderApp('/paciente');

    const region = await upcoming();
    expect(await region.findByText('Dr. João Silveira')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Última notificação' })).not.toBeInTheDocument();
  });

  it('lists the upcoming bookings with a link to all of them', async () => {
    serveHome({
      upcoming: [
        booking('b1'),
        booking('b2', {
          kind: 'exam',
          status: 'pending',
          doctor: null,
          specialty: null,
          examType: { id: 'e1', name: 'Ultrassom' },
          unit: { id: 'u2', name: 'Lab. Central', address: 'Rua B, 2', phone: '+551133335555' },
        }),
      ],
    });
    const { user, router } = renderApp('/paciente');

    const region = await upcoming();
    const [first, second] = (await region.findAllByRole('listitem')).map((item) => within(item));
    expect(first?.getByText('Dr. João Silveira')).toBeVisible();
    expect(first?.getByText('Cardiologia')).toBeVisible();
    expect(first?.getByText('19/07/2030, 15:30')).toBeVisible();
    expect(first?.getByText('Confirmado')).toBeVisible();
    expect(second?.getByText('Exame · Ultrassom')).toBeVisible();
    expect(second?.getByText('Pendente')).toBeVisible();

    await user.click(region.getByRole('link', { name: 'Ver todos os agendamentos' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
  });

  it('shows an empty state without upcoming bookings', async () => {
    serveHome();
    renderApp('/paciente');

    const region = await upcoming();
    expect(await region.findByText('Nenhum agendamento futuro')).toBeVisible();
    expect(region.getByText('Agende uma consulta ou um exame para acompanhar por aqui.')).toBeVisible();
    expect(region.queryByRole('list')).not.toBeInTheDocument();
    expect(region.getByRole('link', { name: 'Ver todos os agendamentos' })).toBeVisible();
  });

  it('marks the list as busy while it loads', async () => {
    const { fetchMock } = serveHome();
    fetchMock.mockImplementationOnce(() => new Promise<Response>(() => undefined));
    renderApp('/paciente', { signedInAs: ['patient'] });

    const region = await screen.findByRole('region', { name: 'Próximos agendamentos' });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Última notificação' })).not.toBeInTheDocument();
  });

  it('shows the error and loads again on retry', async () => {
    let available = false;
    serve(() =>
      available ? { status: 200, body: homeBody({ upcoming: [booking('b1')] }) } : { status: 400 },
    );
    const { user } = renderApp('/paciente');

    const region = await upcoming();
    const retry = await region.findByRole('button', { name: 'Tentar de novo' });
    expect(region.getByRole('alert')).toHaveTextContent(/\S/);
    available = true;
    await user.click(retry);

    expect(await region.findByText('Dr. João Silveira')).toBeVisible();
  });

  it('shows the health measures as not recorded yet', async () => {
    serveHome();
    renderApp('/paciente');

    const region = within(await screen.findByRole('region', { name: 'Minha saúde' }));
    expect(region.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Pressão arterial',
      'Peso atual',
    ]);
    region.getAllByRole('definition').forEach((value) => expect(value).toHaveTextContent('—Sem registro'));
    expect(region.getByText(/depois que o médico registrar suas consultas/)).toBeVisible();
  });

  it.each([
    ['Agendar Consulta', '/paciente/consultas/nova'],
    ['Agendar Exame', '/paciente/exames/novo'],
  ])('links %s to %s', async (name, path) => {
    serveHome();
    renderApp('/paciente');

    const shortcuts = within(await screen.findByRole('navigation', { name: 'Agendar' }));
    expect(shortcuts.getByRole('link', { name })).toHaveAttribute('href', path);
  });
});
