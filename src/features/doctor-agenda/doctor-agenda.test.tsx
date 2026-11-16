import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, serveApi, type ApiCall, type MockResponse } from '@/test/render-app';
import type { DoctorAppointment } from '@lib/api/models';
import { queryKeys } from '@lib/query-keys';
import type { AgendaTab, DoctorHome } from './doctor-api';

const FUTURE = '2030-01-10T13:00:00.000Z';
const NEXT_DAY = '2030-01-11T02:30:00.000Z';
const PAST = '2020-01-10T13:00:00.000Z';
const LIST = '/api/doctor/appointments';
const HOME = '/api/doctor/home';
const NOT_STARTED = 'Esta consulta ainda não começou. Registre o desfecho a partir do horário de início.';
const STALE = 'Este agendamento mudou ou não pode mais ser alterado. Confira a lista atualizada.';
const REASON = 'Informe o motivo do cancelamento.';

const actions = (overrides: Partial<DoctorAppointment['actions']> = {}): DoctorAppointment['actions'] => ({
  canConfirm: false,
  canCancel: false,
  canComplete: false,
  canNoShow: false,
  ...overrides,
});

const appointment = (id: string, overrides: Partial<DoctorAppointment> = {}): DoctorAppointment => ({
  id,
  status: 'pending',
  visitType: 'routine',
  startsAt: FUTURE,
  endsAt: '2030-01-10T13:30:00.000Z',
  notes: null,
  patient: { id: `p-${id}`, fullName: 'Andreia Soares', phone: '+5511987654321' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  unit: { id: 'u1', name: 'Hospital Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
  cancellation: null,
  actions: actions({ canConfirm: true, canCancel: true }),
  ...overrides,
});

const confirmed = (id: string, overrides: Partial<DoctorAppointment> = {}) =>
  appointment(id, { status: 'confirmed', actions: actions({ canCancel: true }), ...overrides });

const unrecorded = (id: string, overrides: Partial<DoctorAppointment> = {}) =>
  confirmed(id, { startsAt: PAST, actions: actions({ canComplete: true, canNoShow: true }), ...overrides });

const counts = { pending: 0, confirmed: 0, awaiting: 0, history: 0 };

const home = (overrides: Partial<DoctorHome> = {}): DoctorHome => ({
  today: {
    date: '2030-01-10',
    total: 6,
    pending: 2,
    confirmed: 0,
    awaitingRecord: 0,
    completed: 4,
    noShow: 0,
    cancelled: 0,
    expired: 0,
  },
  pending: [],
  awaitingRecord: [],
  counts,
  lastNotification: null,
  ...overrides,
});

type Lists = Partial<Record<AgendaTab, DoctorAppointment[]>>;

interface Serve {
  lists?: Lists;
  homeData?: DoctorHome;
  action?: (path: string) => MockResponse;
  totals?: Partial<Record<AgendaTab, number>>;
}

const serve = ({ lists = {}, homeData = home(), action, totals = {} }: Serve) =>
  serveApi(['doctor'], {
    [HOME]: () => ({ status: 200, body: homeData }),
    [LIST]: (_method, _body, url) => {
      const tab = url.searchParams.get('tab') as AgendaTab;
      const count = (key: AgendaTab) => totals[key] ?? lists[key]?.length ?? 0;
      return {
        status: 200,
        body: {
          items: lists[tab] ?? [],
          page: Number(url.searchParams.get('page')),
          pageSize: 10,
          total: count(tab),
          counts: {
            pending: count('pending'),
            confirmed: count('confirmed'),
            awaiting: count('awaiting'),
            history: count('history'),
          },
        },
      };
    },
    ...(action && {
      '/api/appointments/a1/confirm': () => action('confirm'),
      '/api/appointments/a1/cancel': () => action('cancel'),
      '/api/appointments/a1/complete': () => action('complete'),
      '/api/appointments/a1/no-show': () => action('no-show'),
    }),
  });

const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.url.pathname === LIST);
const posts = (calls: ApiCall[]) => calls.filter((call) => call.method === 'POST');

const card = async (name: RegExp) => {
  const header = await screen.findByRole('button', { name });
  return { header, scope: within(header.closest('li') as HTMLElement) };
};

const openCancel = async (user: ReturnType<typeof renderApp>['user']) => {
  const { scope } = await card(/^Andreia Soares/);
  await user.click(scope.getByRole('button', { name: /^Cancelar/ }));
  return screen.getByRole('dialog', { name: 'Cancelar consulta?' });
};

describe('doctor home', { timeout: 15_000 }, () => {
  it('shows the request banner, the summary of today and both appointment sections', async () => {
    serve({
      homeData: home({
        pending: [appointment('a1')],
        awaitingRecord: [unrecorded('a2', { patient: { id: 'p2', fullName: 'Beatriz Neves', phone: null } })],
        counts: { ...counts, pending: 2, awaiting: 1 },
      }),
    });
    renderApp('/medico');

    const banner = await screen.findByRole('link', { name: /Novo pedido de consulta/ });
    expect(banner).toHaveAttribute('href', '/medico/agenda?aba=a-confirmar');
    expect(banner).toHaveTextContent('2 pedidos de consulta esperam por sua confirmação.');

    const summary = screen.getByRole('region', { name: 'Resumo de Hoje' });
    expect(within(summary).getByText('Pendentes hoje').nextSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Total').nextSibling).toHaveTextContent('6');
    expect(within(summary).getByText('Concluídas').nextSibling).toHaveTextContent('4');
    expect(screen.getByRole('link', { name: 'Gerenciar Minha Agenda' })).toHaveAttribute(
      'href',
      '/medico/disponibilidade',
    );

    const pending = screen.getByRole('region', { name: 'Consultas Pendentes' });
    expect(within(pending).getByText('A confirmar')).toBeVisible();
    expect(within(pending).getByRole('button', { name: /^Confirmar/ })).toBeVisible();
    expect(within(pending).getByRole('button', { name: /^Cancelar/ })).toBeVisible();
    expect(within(pending).getByRole('link', { name: 'Ver Agenda Completa' })).toHaveAttribute(
      'href',
      '/medico/agenda',
    );

    const awaiting = screen.getByRole('region', { name: 'Aguardando registro' });
    expect(within(awaiting).getByRole('button', { name: /^Beatriz Neves/ })).toBeVisible();
    expect(within(awaiting).getByText('Aguardando registro', { selector: 'span' })).toBeVisible();
    expect(within(awaiting).queryByRole('button', { name: /^(Confirmar|Cancelar)/ })).not.toBeInTheDocument();
    expect(within(awaiting).getByRole('button', { name: /^Concluir: Beatriz Neves/ })).toBeVisible();
    expect(within(awaiting).getByRole('button', { name: /^Não compareceu: Beatriz Neves/ })).toBeVisible();
    expect(within(awaiting).getByRole('link', { name: 'Ver todas aguardando registro' })).toHaveAttribute(
      'href',
      '/medico/agenda?aba=aguardando-registro',
    );
  });

  it('shows the last notification in place of the request banner', async () => {
    serve({
      homeData: home({
        counts: { ...counts, pending: 1 },
        lastNotification: {
          id: 'n1',
          type: 'appointment_cancelled_by_patient',
          params: { startsAt: FUTURE },
          bookingId: 'a1',
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      }),
    });
    renderApp('/medico');

    const notice = await screen.findByRole('link', { name: /Consulta cancelada pelo paciente/ });
    expect(notice).toHaveAttribute('href', '/medico/agenda?aba=historico');
    expect(screen.getByRole('region', { name: 'Última notificação' })).toContainElement(notice);
    expect(screen.queryByRole('link', { name: /Novo pedido de consulta/ })).not.toBeInTheDocument();
  });

  it('prefers the request banner over a read notification while requests wait', async () => {
    serve({
      homeData: home({
        counts: { ...counts, pending: 1 },
        lastNotification: {
          id: 'n1',
          type: 'appointment_cancelled_by_patient',
          params: { startsAt: FUTURE },
          bookingId: 'a1',
          readAt: PAST,
          createdAt: new Date().toISOString(),
        },
      }),
    });
    renderApp('/medico');

    expect(await screen.findByRole('link', { name: /Novo pedido de consulta/ })).toHaveTextContent(
      'Um pedido de consulta espera por sua confirmação.',
    );
    expect(screen.queryByRole('link', { name: /Consulta cancelada pelo paciente/ })).not.toBeInTheDocument();
  });

  it('shows a read notification when no request waits', async () => {
    serve({
      homeData: home({
        lastNotification: {
          id: 'n1',
          type: 'appointment_cancelled_by_patient',
          params: { startsAt: FUTURE },
          bookingId: 'a1',
          readAt: PAST,
          createdAt: new Date().toISOString(),
        },
      }),
    });
    renderApp('/medico');

    expect(await screen.findByRole('link', { name: /Consulta cancelada pelo paciente/ })).toBeVisible();
    expect(screen.queryByRole('link', { name: /Novo pedido de consulta/ })).not.toBeInTheDocument();
  });

  it('shows only the error when the home fails to load', async () => {
    serveApi(['doctor'], { [HOME]: () => ({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'x' } }) });
    renderApp('/medico');

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Resumo de Hoje' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Consultas Pendentes' })).not.toBeInTheDocument();
  });

  it('moves the focus to the agenda link when the confirmed request leaves the home', async () => {
    const data = home({ pending: [appointment('a1')], counts: { ...counts, pending: 1 } });
    serve({
      homeData: data,
      action: () => {
        data.pending = [];
        data.counts = counts;
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico');

    const { scope } = await card(/^Andreia Soares/);
    await user.click(scope.getByRole('button', { name: /^Confirmar/ }));

    expect(await screen.findByText('Nenhum pedido a confirmar')).toBeVisible();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Ver Agenda Completa' })).toHaveFocus());
  });

  it('completes an appointment from the awaiting section and moves the focus when it leaves', async () => {
    const data = home({ awaitingRecord: [unrecorded('a1')], counts: { ...counts, awaiting: 1 } });
    const { calls } = serve({
      homeData: data,
      action: () => {
        data.awaitingRecord = [];
        data.counts = counts;
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico');
    const section = await screen.findByRole('region', { name: 'Aguardando registro' });
    await user.click(await within(section).findByRole('button', { name: /^Concluir/ }));
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/complete');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
    expect(await screen.findByText('Nenhuma consulta aguardando registro')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Ver todas aguardando registro' })).toHaveFocus(),
    );
  });

  it('registers a no-show from the awaiting section and moves the focus to its link', async () => {
    const data = home({ awaitingRecord: [unrecorded('a1')], counts: { ...counts, awaiting: 1 } });
    const { calls } = serve({
      homeData: data,
      action: () => {
        data.awaitingRecord = [];
        data.counts = counts;
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico');
    const section = await screen.findByRole('region', { name: 'Aguardando registro' });
    await user.click(await within(section).findByRole('button', { name: /^Não compareceu/ }));
    const dialog = screen.getByRole('dialog', { name: 'Registrar falta?' });
    await user.click(within(dialog).getByRole('button', { name: 'Registrar falta' }));
    expect(await screen.findByText('Falta registrada.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/no-show');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
    expect(await screen.findByText('Nenhuma consulta aguardando registro')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Ver todas aguardando registro' })).toHaveFocus(),
    );
  });

  it('hides the banner and shows empty sections when nothing waits', async () => {
    serve({});
    renderApp('/medico');

    expect(await screen.findByText('Nenhum pedido a confirmar')).toBeVisible();
    expect(screen.getByText('Nenhuma consulta aguardando registro')).toBeVisible();
    expect(screen.queryByRole('link', { name: /Novo pedido de consulta/ })).not.toBeInTheDocument();
  });
});

describe('doctor agenda', { timeout: 15_000 }, () => {
  it('switches tabs through the URL and keeps each tab count', async () => {
    const { calls } = serve({ lists: { pending: [appointment('a1')], confirmed: [confirmed('a2')] } });
    const { user, router } = renderApp('/medico/agenda');

    expect(await screen.findByRole('heading', { level: 1, name: 'Consultas Agendadas' })).toBeVisible();
    expect(await screen.findByRole('tab', { name: 'A confirmar (1)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('A confirmar', { selector: 'span' })).toBeVisible();
    expect(listCalls(calls)[0]?.url.searchParams.get('tab')).toBe('pending');

    await user.click(screen.getByRole('tab', { name: 'Confirmadas (1)' }));

    expect(router.state.location.search).toBe('?aba=confirmadas');
    expect(screen.getByRole('tab', { name: 'Confirmadas (1)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'A confirmar (1)' })).toBeVisible();
    expect(await screen.findByText('Confirmado')).toBeVisible();
    expect(listCalls(calls).at(-1)?.url.searchParams.get('tab')).toBe('confirmed');

    await user.click(screen.getByRole('tab', { name: /^Histórico/ }));
    expect(router.state.location.search).toBe('?aba=historico');
    expect(await screen.findByText('Nenhuma consulta no histórico')).toBeVisible();
  });

  it('opens the awaiting tab from the URL', async () => {
    const { calls } = serve({ lists: { awaiting: [confirmed('a1', { startsAt: PAST })] } });
    renderApp('/medico/agenda?aba=aguardando-registro');

    expect(await screen.findByRole('tab', { name: /Aguardando registro/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('Aguardando registro', { selector: 'span' })).toBeVisible();
    expect(listCalls(calls)[0]?.url.searchParams.get('tab')).toBe('awaiting');
  });

  it('groups the appointments by São Paulo day', async () => {
    serve({
      lists: {
        pending: [
          appointment('a1'),
          appointment('a2', {
            startsAt: NEXT_DAY,
            patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null },
          }),
          appointment('a3', {
            startsAt: '2030-01-12T13:00:00.000Z',
            patient: { id: 'p3', fullName: 'Gilberto Souza', phone: null },
          }),
        ],
      },
    });
    renderApp('/medico/agenda');

    await screen.findByRole('button', { name: /^Gilberto Souza/ });
    const days = screen.getAllByRole('heading', { level: 2 });
    expect(days.map((day) => day.textContent)).toEqual(['qui., 10/01', 'sáb., 12/01']);
    const first = days[0]?.parentElement as HTMLElement;
    expect(within(first).getByRole('button', { name: /^Andreia Soares/ })).toBeVisible();
    expect(within(first).getByRole('button', { name: /^Jair Oliveira/ })).toBeVisible();
  });

  it('expands a card with the patient phone, notes and unit', async () => {
    serve({ lists: { pending: [appointment('a1', { notes: 'Dor no peito\nhá dois dias' })] } });
    const { user } = renderApp('/medico/agenda');

    const { header, scope } = await card(/^Andreia Soares/);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(scope.getByText('Rua das Flores, 123')).not.toBeVisible();
    expect(header).not.toContainElement(scope.getByRole('button', { name: /^Confirmar/ }));

    await user.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(scope.getByRole('link', { name: '(11) 98765-4321' })).toHaveAttribute(
      'href',
      'tel:+5511987654321',
    );
    expect(scope.getByText(/Dor no peito/)).toBeVisible();
    expect(scope.getByText('Rotina')).toBeVisible();
    expect(scope.getByText('Rua das Flores, 123')).toBeVisible();
  });

  it('shows a cancelled appointment without a phone link', async () => {
    serve({
      lists: {
        history: [
          appointment('a1', {
            status: 'cancelled',
            patient: { id: 'p1', fullName: 'Andreia Soares', phone: null },
            actions: actions(),
            cancellation: { byRole: 'patient', reason: 'Viagem.', late: false, cancelledAt: PAST },
          }),
        ],
      },
    });
    const { user } = renderApp('/medico/agenda?aba=historico');

    const { header, scope } = await card(/^Andreia Soares/);
    await user.click(header);

    expect(scope.getByText('Telefone indisponível')).toBeVisible();
    expect(scope.queryByRole('link')).not.toBeInTheDocument();
    expect(scope.getByText(/^Cancelada pelo paciente em/)).toBeVisible();
    expect(scope.getByText('Motivo: Viagem.')).toBeVisible();
    expect(scope.queryByRole('button', { name: /^(Confirmar|Cancelar)/ })).not.toBeInTheDocument();
  });

  it('confirms with the start time it showed and refreshes the doctor data', async () => {
    const { calls } = serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user, queryClient } = renderApp('/medico/agenda');

    const { scope } = await card(/^Andreia Soares/);
    queryClient.setQueryData(queryKeys.doctor.home, home());
    const before = listCalls(calls).length;
    await user.click(scope.getByRole('button', { name: /^Confirmar/ }));

    expect(await screen.findByText('Consulta confirmada.')).toBeVisible();
    expect(queryClient.getQueryState(queryKeys.doctor.home)?.isInvalidated).toBe(true);
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/confirm');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: FUTURE });
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('explains a stale request when confirming and refreshes the list on 409', async () => {
    const { calls } = serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 409, body: { code: 'INVALID_STATE', message: 'Consulta já confirmada.' } }),
    });
    const { user } = renderApp('/medico/agenda');

    const { scope } = await card(/^Andreia Soares/);
    const before = listCalls(calls).length;
    await user.click(scope.getByRole('button', { name: /^Confirmar/ }));

    expect(await screen.findByText(STALE)).toBeVisible();
    expect(screen.queryByText('Consulta já confirmada.')).not.toBeInTheDocument();
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('moves the focus to the results line when the confirmed request leaves the list', async () => {
    const lists = { pending: [appointment('a1')] };
    serve({
      lists,
      action: () => {
        lists.pending = [];
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico/agenda');

    const { scope } = await card(/^Andreia Soares/);
    const results = screen.getByText('1 consulta');
    await user.click(scope.getByRole('button', { name: /^Confirmar/ }));

    expect(await screen.findByText('Nenhum pedido a confirmar')).toBeVisible();
    await waitFor(() => expect(results).toHaveFocus());
  });

  it('blocks the other confirmations while one is being sent', async () => {
    serve({
      lists: {
        pending: [
          appointment('a1'),
          appointment('a2', { patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null } }),
        ],
      },
      action: () => ({ status: 200, body: {} }),
    });
    renderApp('/medico/agenda');

    const first = await card(/^Andreia Soares/);
    const second = await card(/^Jair Oliveira/);
    fireEvent.click(first.scope.getByRole('button', { name: /^Confirmar/ }));

    await waitFor(() => expect(second.scope.getByRole('button', { name: /^Confirmar/ })).toBeDisabled());
    expect(await screen.findByText('Consulta confirmada.')).toBeVisible();
  });

  it('shows the outcome buttons only when the API allows them', async () => {
    serve({
      lists: {
        awaiting: [
          unrecorded('a1'),
          unrecorded('a2', {
            patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null },
            actions: actions({ canComplete: true }),
          }),
        ],
      },
    });
    renderApp('/medico/agenda?aba=aguardando-registro');
    const first = await card(/^Andreia Soares/);
    expect(first.scope.getByRole('button', { name: /^Concluir: Andreia Soares/ })).toBeVisible();
    expect(first.scope.getByRole('button', { name: /^Não compareceu: Andreia Soares/ })).toBeVisible();
    expect(first.scope.queryByRole('button', { name: /^(Confirmar|Cancelar)/ })).not.toBeInTheDocument();
    const second = await card(/^Jair Oliveira/);
    expect(second.scope.getByRole('button', { name: /^Concluir/ })).toBeVisible();
    expect(second.scope.queryByRole('button', { name: /^Não compareceu/ })).not.toBeInTheDocument();
  });

  it('shows completed and missed appointments in the history with the doctor labels', async () => {
    serve({
      lists: {
        history: [
          appointment('a1', { status: 'completed', startsAt: PAST, actions: actions() }),
          appointment('a2', {
            status: 'no_show',
            startsAt: PAST,
            patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null },
            actions: actions(),
          }),
        ],
      },
    });
    renderApp('/medico/agenda?aba=historico');
    const completed = await card(/^Andreia Soares/);
    expect(completed.scope.getByText('Concluída')).toBeVisible();
    const missed = await card(/^Jair Oliveira/);
    expect(missed.scope.getByText('Não compareceu')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /^(Concluir|Não compareceu|Confirmar|Cancelar)/ }),
    ).not.toBeInTheDocument();
  });

  it('links to the patient results only from started exam reviews that are confirmed or completed', async () => {
    const review = { visitType: 'exam_review' as const, actions: actions() };
    const patient = (id: string, fullName: string) => ({ patient: { id, fullName, phone: null } });
    serve({
      lists: {
        history: [
          appointment('a1', { ...review, status: 'completed', startsAt: PAST }),
          appointment('a2', {
            ...review,
            ...patient('p2', 'Jair Oliveira'),
            status: 'confirmed',
            startsAt: PAST,
          }),
          appointment('a3', {
            ...review,
            ...patient('p3', 'Carla Dias'),
            status: 'confirmed',
            startsAt: FUTURE,
          }),
          appointment('a4', {
            ...review,
            ...patient('p4', 'Davi Lima'),
            status: 'cancelled',
            startsAt: PAST,
          }),
          appointment('a5', {
            ...patient('p5', 'Eva Rocha'),
            status: 'completed',
            startsAt: PAST,
            actions: actions(),
          }),
        ],
      },
    });
    const { user } = renderApp('/medico/agenda?aba=historico');

    const links = await screen.findAllByRole('link', { name: /^Ver exames do paciente/ });
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/medico/pacientes/p-a1/exames',
      '/medico/pacientes/p2/exames',
    ]);
    expect(links[1]).toHaveAccessibleName(/^Ver exames do paciente: Jair Oliveira/);

    serveApi(['doctor'], {
      '/api/doctor/patients/p-a1/exam-results': () => ({
        status: 200,
        body: { items: [], page: 1, pageSize: 10, total: 0 },
      }),
    });
    await user.click(links[0] as HTMLElement);
    expect(await screen.findByRole('heading', { level: 1, name: 'Exames de Andreia Soares' })).toBeVisible();
  });

  it('completes with the start time it showed and refreshes the doctor data', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user, queryClient } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    queryClient.setQueryData(queryKeys.doctor.home, home());
    const before = listCalls(calls).length;
    await user.click(scope.getByRole('button', { name: /^Concluir/ }));
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
    expect(queryClient.getQueryState(queryKeys.doctor.home)?.isInvalidated).toBe(true);
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/complete');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('asks before registering a no-show and sends it only after the confirmation', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    const trigger = scope.getByRole('button', { name: /^Não compareceu/ });
    await user.click(trigger);
    let dialog = screen.getByRole('dialog', { name: 'Registrar falta?' });
    expect(dialog).toHaveAccessibleDescription(
      /^Andreia Soares não compareceu à consulta de .+\. Esse registro não pode ser desfeito\.$/,
    );
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(dialog).not.toBeVisible();
    expect(trigger).toHaveFocus();
    expect(posts(calls)).toHaveLength(0);
    await user.click(trigger);
    dialog = screen.getByRole('dialog', { name: 'Registrar falta?' });
    await user.click(within(dialog).getByRole('button', { name: 'Registrar falta' }));
    expect(await screen.findByText('Falta registrada.')).toBeVisible();
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/no-show');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
    await waitFor(() => expect(dialog).not.toBeVisible());
  });

  it('explains an appointment that has not started yet and refreshes the list', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({
        status: 409,
        body: { code: 'NOT_STARTED', message: 'A consulta ainda não começou.' },
      }),
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    const before = listCalls(calls).length;
    await user.click(scope.getByRole('button', { name: /^Concluir/ }));
    expect(await screen.findByText(NOT_STARTED)).toBeVisible();
    expect(screen.queryByText('A consulta ainda não começou.')).not.toBeInTheDocument();
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('explains a stale outcome, closes the confirmation and refreshes the list on 409', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 409, body: { code: 'INVALID_STATE', message: 'Consulta já registrada.' } }),
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    const before = listCalls(calls).length;
    await user.click(scope.getByRole('button', { name: /^Não compareceu/ }));
    const dialog = screen.getByRole('dialog', { name: 'Registrar falta?' });
    await user.click(within(dialog).getByRole('button', { name: 'Registrar falta' }));
    expect(await screen.findByText(STALE)).toBeVisible();
    await waitFor(() => expect(dialog).not.toBeVisible());
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('explains a missing appointment on 404 when completing', async () => {
    serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 404, body: { code: 'NOT_FOUND', message: 'Consulta não encontrada.' } }),
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    await user.click(scope.getByRole('button', { name: /^Concluir/ }));
    expect(
      await screen.findByText('Este agendamento não existe mais. Confira a lista atualizada.'),
    ).toBeVisible();
  });

  it('moves the focus to the results line when the missed appointment leaves the list', async () => {
    const lists = { awaiting: [unrecorded('a1')] };
    serve({
      lists,
      action: () => {
        lists.awaiting = [];
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    const results = screen.getByText('1 consulta');
    await user.click(scope.getByRole('button', { name: /^Não compareceu/ }));
    await user.click(screen.getByRole('button', { name: 'Registrar falta' }));
    expect(await screen.findByText('Nenhuma consulta aguardando registro')).toBeVisible();
    await waitFor(() => expect(results).toHaveFocus());
  });

  it('moves the focus to the results line when the missed appointment leaves a list that keeps others', async () => {
    const other = unrecorded('a2', { patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null } });
    const lists = { awaiting: [unrecorded('a1'), other] };
    serve({
      lists,
      action: () => {
        lists.awaiting = [other];
        return { status: 200, body: {} };
      },
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    const results = screen.getByText('2 consultas');
    await user.click(scope.getByRole('button', { name: /^Não compareceu/ }));
    await user.click(screen.getByRole('button', { name: 'Registrar falta' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^Andreia Soares/ })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(results).toHaveFocus());
  });

  it('moves the focus to the results line when a stale outcome empties the list', async () => {
    const lists = { awaiting: [unrecorded('a1')] };
    serve({
      lists,
      action: () => {
        lists.awaiting = [];
        return { status: 409, body: { code: 'INVALID_STATE', message: 'Consulta já registrada.' } };
      },
    });
    const { user } = renderApp('/medico/agenda?aba=aguardando-registro');
    const { scope } = await card(/^Andreia Soares/);
    const results = screen.getByText('1 consulta');
    await user.click(scope.getByRole('button', { name: /^Concluir/ }));
    expect(await screen.findByText(STALE)).toBeVisible();
    expect(await screen.findByText('Nenhuma consulta aguardando registro')).toBeVisible();
    await waitFor(() => expect(results).toHaveFocus());
  });

  it('blocks every outcome button while one is being sent', async () => {
    serve({
      lists: {
        awaiting: [
          unrecorded('a1'),
          unrecorded('a2', { patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null } }),
        ],
      },
      action: () => ({ status: 200, body: {} }),
    });
    renderApp('/medico/agenda?aba=aguardando-registro');
    const first = await card(/^Andreia Soares/);
    const second = await card(/^Jair Oliveira/);
    fireEvent.click(first.scope.getByRole('button', { name: /^Concluir/ }));
    await waitFor(() => {
      expect(first.scope.getByRole('button', { name: /^Concluir/ })).toHaveAttribute('aria-disabled', 'true');
      expect(first.scope.getByRole('button', { name: /^Não compareceu/ })).toBeDisabled();
      expect(second.scope.getByRole('button', { name: /^Concluir/ })).toBeDisabled();
      expect(second.scope.getByRole('button', { name: /^Não compareceu/ })).toBeDisabled();
    });
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
  });

  it('requires a reason before cancelling', async () => {
    const { calls } = serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp('/medico/agenda');

    const dialog = await openCancel(user);
    expect(within(dialog).getByText(/^Rotina com Andreia Soares em/)).toBeVisible();
    const reason = within(dialog).getByRole('textbox', { name: 'Motivo' });
    expect(reason).toBeRequired();
    await user.type(reason, '   ');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await within(dialog).findByText(REASON)).toBeVisible();
    expect(reason).toHaveFocus();
    expect(posts(calls)).toHaveLength(0);
  });

  it('shows the reason error from the API on 422', async () => {
    serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({
        status: 422,
        body: { code: 'REASON_REQUIRED', message: REASON, fields: { reason: REASON } },
      }),
    });
    const { user } = renderApp('/medico/agenda');

    const dialog = await openCancel(user);
    await user.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'Imprevisto');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await within(dialog).findByText(REASON)).toBeVisible();
    expect(within(dialog).getByRole('textbox', { name: 'Motivo' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('cancels with a multi-line reason and refreshes the list', async () => {
    const { calls } = serve({
      lists: { confirmed: [confirmed('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp('/medico/agenda?aba=confirmadas');

    const dialog = await openCancel(user);
    await user.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'Imprevisto{Enter}Remarcar');
    const before = listCalls(calls).length;
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await screen.findByText('Agendamento cancelado.')).toBeVisible();
    expect(posts(calls)[0]?.body).toEqual({ startsAt: FUTURE, reason: 'Imprevisto\nRemarcar' });
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
    await waitFor(() => expect(dialog).not.toBeVisible());
  });

  it('explains a missing appointment on 404 when cancelling', async () => {
    serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 404, body: { code: 'NOT_FOUND', message: 'Consulta não encontrada.' } }),
    });
    const { user } = renderApp('/medico/agenda');

    const dialog = await openCancel(user);
    await user.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'Imprevisto');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Este agendamento não existe mais. Confira a lista atualizada.',
    );
    expect(within(dialog).queryByRole('button', { name: 'Cancelar agendamento' })).not.toBeInTheDocument();
  });

  it('paginates through the URL and resets the page when the tab changes', async () => {
    const { calls } = serve({ lists: { pending: [appointment('a1')] }, totals: { pending: 25 } });
    const { user, router } = renderApp('/medico/agenda');

    expect(await screen.findByText('25 consultas')).toBeVisible();
    const pages = screen.getByRole('navigation', { name: 'Paginação' });
    await user.click(within(pages).getByRole('button', { name: 'Página 2' }));

    expect(router.state.location.search).toBe('?pagina=2');
    await waitFor(() => expect(listCalls(calls).at(-1)?.url.searchParams.get('page')).toBe('2'));

    await user.click(screen.getByRole('tab', { name: /^Confirmadas/ }));
    expect(router.state.location.search).toBe('?aba=confirmadas');
  });

  it('shows an empty state for each tab', async () => {
    serve({});
    const { user } = renderApp('/medico/agenda');

    expect(await screen.findByText('Nenhum pedido a confirmar')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: /^Confirmadas/ }));
    expect(await screen.findByText('Nenhuma consulta confirmada')).toBeVisible();
  });
});
