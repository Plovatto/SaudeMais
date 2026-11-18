import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { renderApp, serveApi, type ApiCall, type MockResponse } from '@/test/render-app';
import { DESKTOP_QUERY } from '@hooks/useMediaQuery';
import type { PatientBooking } from '@lib/api/models';

const FUTURE = '2030-01-10T13:00:00.000Z';
const PAST = '2020-01-10T13:00:00.000Z';
const LIST = '/api/patient/bookings';
const STALE = 'Este agendamento mudou ou não pode mais ser alterado. Confira a lista atualizada.';

const actions = (overrides: Partial<PatientBooking['actions']> = {}): PatientBooking['actions'] => ({
  canCancel: true,
  lateCancellation: false,
  cancelBlockedReason: null,
  canReschedule: true,
  rescheduleBlockedReason: null,
  reschedulesLeft: 2,
  ...overrides,
});

const booking = (id: string, overrides: Partial<PatientBooking> = {}): PatientBooking => ({
  id,
  kind: 'appointment',
  status: 'confirmed',
  startsAt: FUTURE,
  endsAt: '2030-01-10T13:30:00.000Z',
  notes: null,
  visitType: 'routine',
  doctor: { id: 'd1', fullName: 'Dr. João Silveira' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  examType: null,
  publicCode: null,
  unit: { id: 'u1', name: 'Hospital Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
  actions: actions(),
  cancellation: null,
  hasResult: false,
  ...overrides,
});

const closed = actions({
  canCancel: false,
  cancelBlockedReason: 'closed',
  canReschedule: false,
  rescheduleBlockedReason: 'closed',
});

const late = actions({
  lateCancellation: true,
  canReschedule: false,
  rescheduleBlockedReason: 'window_closed',
});

const exam = (id: string, overrides: Partial<PatientBooking> = {}) =>
  booking(id, {
    kind: 'exam',
    doctor: null,
    specialty: null,
    examType: { id: 'e1', name: 'Ultrassom' },
    publicCode: 'EX-123',
    unit: { id: 'u2', name: 'Lab. Central', address: 'Rua B, 2', phone: '+551133335555' },
    ...overrides,
  });

type Lists = Partial<Record<'upcoming' | 'past', PatientBooking[]>>;

const serve = (lists: Lists, cancel?: () => MockResponse, total?: number) =>
  serveApi(['patient'], {
    [LIST]: (_method, _body, url) => {
      const kind = url.searchParams.get('kind');
      const status = url.searchParams.get('status');
      const items = (lists[url.searchParams.get('scope') as 'upcoming' | 'past'] ?? []).filter(
        (item) => (!kind || item.kind === kind) && (!status || item.status === status),
      );
      return {
        status: 200,
        body: {
          items,
          page: Number(url.searchParams.get('page')),
          pageSize: 10,
          total: total ?? items.length,
          counts: { upcoming: lists.upcoming?.length ?? 0, past: lists.past?.length ?? 0 },
        },
      };
    },
    ...(cancel && { '/api/appointments/b1/cancel': cancel, '/api/exam-bookings/b1/cancel': cancel }),
  });

const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.url.pathname === LIST);

const SHEET = 'Detalhes do agendamento';

type User = ReturnType<typeof renderApp>['user'];

const openDetail = async (user: User, name: RegExp, index = 0) => {
  const rows = await screen.findAllByRole('button', { name });
  await user.click(rows[index] as HTMLElement);
  return within(await screen.findByRole('dialog', { name: SHEET }));
};

const openCancel = async (user: User, name = /Dr\. João Silveira/, title = 'Cancelar a consulta?') => {
  const detail = await openDetail(user, name);
  await user.click(detail.getByRole('button', { name: 'Cancelar' }));
  return screen.getByRole('dialog', { name: title });
};

describe('patient bookings', { timeout: 15_000 }, () => {
  it('switches between the upcoming and past tabs through the URL', async () => {
    const { calls } = serve({
      upcoming: [booking('b1')],
      past: [booking('b2', { status: 'completed', startsAt: PAST, actions: closed })],
    });
    const { user, router } = renderApp('/paciente/agendamentos');

    expect(await screen.findByRole('heading', { level: 1, name: 'Meus agendamentos' })).toBeVisible();
    const upcoming = await screen.findByRole('tab', { name: /^Próximos/ });
    expect(upcoming).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Confirmado')).toBeVisible();
    expect(listCalls(calls)[0]?.url.searchParams.get('scope')).toBe('upcoming');

    await user.click(screen.getByRole('tab', { name: /^Histórico/ }));

    expect(router.state.location.search).toBe('?aba=realizados');
    expect(screen.queryByText('Confirmado')).not.toBeInTheDocument();
    expect(await screen.findByText('Concluída')).toBeVisible();
    expect(screen.getByRole('tab', { name: /^Histórico/ })).toHaveAttribute('aria-selected', 'true');
    expect(listCalls(calls).at(-1)?.url.searchParams.get('scope')).toBe('past');
  });

  it('opens the past tab from the URL', async () => {
    serve({ past: [booking('b2', { status: 'completed', startsAt: PAST, actions: closed })] });
    renderApp('/paciente/agendamentos?aba=realizados');

    expect(await screen.findByRole('tab', { name: /^Histórico/ })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Concluída')).toBeVisible();
  });

  it('groups the bookings by month and names each row with its day', async () => {
    serve({
      upcoming: [
        booking('b1'),
        exam('b2', { startsAt: '2030-02-05T12:00:00.000Z', endsAt: '2030-02-05T12:15:00.000Z' }),
      ],
    });
    renderApp('/paciente/agendamentos');

    const list = within(await screen.findByRole('region', { name: 'Lista de agendamentos' }));
    expect(list.getByText('Janeiro de 2030')).toBeVisible();
    expect(list.getByText('Fevereiro de 2030')).toBeVisible();
    expect(list.getAllByRole('button')[0]).toHaveAccessibleName(/Qui, 10\/01,\s*Dr\. João Silveira/);
    expect(list.getByText('09:00 · Exame · Lab. Central')).toBeVisible();
  });

  it('links to the result only for an exam that has one', async () => {
    const done = { status: 'completed', startsAt: PAST, actions: closed } as const;
    serve({ past: [exam('b1', { ...done, hasResult: true }), exam('b2', done)] });
    const { user, router } = renderApp('/paciente/agendamentos?aba=realizados');

    let detail = await openDetail(user, /Ultrassom/, 1);
    expect(detail.queryByRole('link', { name: 'Ver resultado' })).not.toBeInTheDocument();
    await user.click(detail.getByRole('button', { name: 'Fechar' }));

    detail = await openDetail(user, /Ultrassom/, 0);
    expect(detail.getByText('Sobre o resultado')).toBeVisible();
    await user.click(detail.getByRole('link', { name: 'Ver resultado' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/exames/b1/resultado'));
  });

  it('shows the patient label for each effective status', async () => {
    const statuses: [Partial<PatientBooking>, string][] = [
      [{ status: 'pending' }, 'Pendente'],
      [{ status: 'confirmed' }, 'Confirmado'],
      [{ status: 'confirmed', startsAt: PAST, actions: closed }, 'Aguardando registro'],
      [{ status: 'completed', startsAt: PAST, actions: closed }, 'Concluída'],
      [{ status: 'cancelled', actions: closed }, 'Cancelada'],
      [{ status: 'no_show', startsAt: PAST, actions: closed }, 'Não compareceu'],
      [{ status: 'expired', startsAt: PAST, actions: closed }, 'Não confirmada'],
    ];
    serve({ past: statuses.map(([overrides], index) => booking(`s${index}`, overrides)) });
    renderApp('/paciente/agendamentos?aba=realizados');

    const rows = await screen.findAllByRole('button', { name: /Dr\. João Silveira/ });
    rows.forEach((row, index) => expect(within(row).getByText(statuses[index]?.[1] ?? '')).toBeVisible());
  });

  it('opens the details in a sheet on small screens and closes it', async () => {
    serve({ upcoming: [booking('b1', { notes: 'Consulta de rotina' })] });
    const { user, router } = renderApp('/paciente/agendamentos');

    expect(screen.queryByRole('dialog', { name: SHEET })).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Dr\. João Silveira/ })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    const detail = await openDetail(user, /Dr\. João Silveira/);

    expect(router.state.location.search).toBe('?id=b1');
    expect(detail.getByRole('heading', { name: 'Dr. João Silveira' })).toBeVisible();
    expect(detail.getByText('Consulta · Cardiologia · Rotina')).toBeVisible();
    expect(detail.getByText('Quinta, 10 de janeiro · 10:00')).toBeVisible();
    expect(detail.getByText('30 minutos')).toBeVisible();
    expect(detail.getByText('Rua das Flores, 123')).toBeVisible();
    expect(detail.getByRole('link', { name: '(11) 3333-4444' })).toHaveAttribute('href', 'tel:+551133334444');
    expect(detail.getByText('Consulta de rotina')).toBeVisible();
    expect(detail.getByText('Antes de ir')).toBeVisible();
    expect(detail.getByText('Antes de ir').parentElement).toHaveClass(
      'in-data-[grow=true]:in-data-[sheet=min]:hidden',
    );

    await user.click(detail.getByRole('button', { name: 'Fechar' }));

    expect(router.state.location.search).toBe('');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: SHEET })).not.toBeInTheDocument());
  });

  it('opens the booking of the address directly', async () => {
    serve({ upcoming: [booking('b1'), exam('b2')] });
    renderApp('/paciente/agendamentos?id=b2');

    const detail = within(await screen.findByRole('dialog', { name: SHEET }));
    expect(detail.getByRole('heading', { name: 'Ultrassom' })).toBeVisible();
    expect(detail.getByText('EX-123')).toBeVisible();
  });

  it('forgets a booking of the address that is not in the list', async () => {
    serve({ upcoming: [booking('b1')] });
    const { router } = renderApp('/paciente/agendamentos?id=b9');

    await screen.findByRole('button', { name: /Dr\. João Silveira/ });
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(router.state.historyAction).toBe('REPLACE');
    expect(screen.queryByRole('dialog', { name: SHEET })).not.toBeInTheDocument();
  });

  it('does not reopen a cancelled booking on another tab', async () => {
    const lists: Lists = { upcoming: [booking('b1')], past: [] };
    serve(lists, () => {
      lists.past = [booking('b1', { status: 'cancelled', actions: closed })];
      lists.upcoming = [];
      return { status: 200, body: {} };
    });
    const { user, router } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));
    await screen.findByText('Nada por aqui');
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await user.click(screen.getByRole('tab', { name: /^Histórico/ }));

    expect((await screen.findAllByText('Cancelada')).length).toBeGreaterThan(0);
    expect(router.state.location.search).toBe('?aba=realizados');
    expect(screen.queryByRole('dialog', { name: SHEET })).not.toBeInTheDocument();
  });

  it('shows the details beside the list on large screens', async () => {
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    serve({ upcoming: [booking('b1'), exam('b2')] });
    const { user, router } = renderApp('/paciente/agendamentos');

    const first = await screen.findByRole('button', { name: /Dr\. João Silveira/ });
    expect(first).toHaveAttribute('aria-current', 'true');
    expect(first).not.toHaveAttribute('aria-haspopup');
    const aside = screen.getByRole('complementary', { name: 'Detalhes do agendamento' });
    expect(await within(aside).findByRole('heading', { name: 'Dr. João Silveira' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: SHEET })).not.toBeInTheDocument();
    expect(screen.queryByText('Antes de ir')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ultrassom/ }));

    expect(router.state.location.search).toBe('?id=b2');
    expect(await screen.findByRole('heading', { name: 'Ultrassom' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Ultrassom/ })).toHaveAttribute('aria-current', 'true');
    expect(first).not.toHaveAttribute('aria-current');
  });

  it('links to the reschedule page and tells how many reschedules are left', async () => {
    serve({ upcoming: [booking('b1'), exam('b2', { actions: actions({ reschedulesLeft: 1 }) })] });
    const { user } = renderApp('/paciente/agendamentos');

    let detail = await openDetail(user, /Dr\. João Silveira/);
    const link = detail.getByRole('link', { name: 'Reagendar' });
    expect(link).toHaveAttribute('href', '/paciente/consultas/b1/reagendar');
    expect(link).toHaveAccessibleDescription('2 reagendamentos restantes');
    await user.click(detail.getByRole('button', { name: 'Fechar' }));

    detail = await openDetail(user, /Ultrassom/);
    expect(detail.getByRole('link', { name: 'Reagendar' })).toHaveAttribute(
      'href',
      '/paciente/exames/b2/reagendar',
    );
    expect(detail.getByText('1 reagendamento restante')).toBeVisible();
  });

  it('explains why a booking can no longer be rescheduled', async () => {
    serve({
      upcoming: [
        booking('b1', { actions: late }),
        exam('b2', {
          actions: actions({ canReschedule: false, rescheduleBlockedReason: 'limit', reschedulesLeft: 0 }),
        }),
      ],
    });
    const { user } = renderApp('/paciente/agendamentos');

    let detail = await openDetail(user, /Dr\. João Silveira/);
    expect(detail.queryByRole('link', { name: 'Reagendar' })).not.toBeInTheDocument();
    expect(detail.getByRole('note')).toHaveTextContent(/não pode mais ser reagendado, só cancelado/);
    expect(detail.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await user.click(detail.getByRole('button', { name: 'Fechar' }));

    detail = await openDetail(user, /Ultrassom/);
    expect(detail.queryByRole('link', { name: 'Reagendar' })).not.toBeInTheDocument();
    expect(detail.getByRole('note')).toHaveTextContent(/já usou todos os reagendamentos/);
    expect(detail.queryByText(/reagendamentos? restantes?/)).not.toBeInTheDocument();
  });

  it('shows who cancelled, the reason and the late flag', async () => {
    serve({
      past: [
        booking('b1', {
          status: 'cancelled',
          actions: closed,
          cancellation: { byRole: 'doctor', reason: 'Imprevisto.', late: true, cancelledAt: PAST },
        }),
        exam('b2', { actions: closed }),
      ],
    });
    const { user } = renderApp('/paciente/agendamentos?aba=realizados');

    let detail = await openDetail(user, /Dr\. João Silveira/);
    expect(detail.getByText(/^Cancelada pelo médico em/)).toBeVisible();
    expect(detail.getByText('Motivo: Imprevisto.')).toBeVisible();
    expect(detail.getByText('Cancelamento tardio')).toBeVisible();
    expect(detail.getByText('Sobre este agendamento')).toBeVisible();
    expect(detail.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    await user.click(detail.getByRole('button', { name: 'Fechar' }));

    detail = await openDetail(user, /Ultrassom/);
    expect(detail.getByText('EX-123')).toBeVisible();
    expect(detail.queryByRole('note')).not.toBeInTheDocument();
    expect(detail.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('cancels a booking with an optional reason and refreshes the list', async () => {
    const { calls } = serve({ upcoming: [booking('b1')] }, () => ({ status: 200, body: {} }));
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    expect(within(dialog).getByText(/O horário fica livre para outra pessoa/)).toBeVisible();
    expect(within(dialog).getByText('Qui, 10/01 às 10:00 · Hospital Central')).toBeVisible();
    expect(within(dialog).queryByText(/registrado como tardio/)).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole('textbox', { name: 'Motivo (opcional)' }), 'Imprevisto');
    const before = listCalls(calls).length;
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await screen.findByText('Agendamento cancelado.')).toBeVisible();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      startsAt: FUTURE,
      reason: 'Imprevisto',
    });
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
    await waitFor(() => expect(dialog).not.toBeVisible());
  });

  it('cancels an exam through the exam endpoint without a reason', async () => {
    const { calls } = serve({ upcoming: [exam('b1')] }, () => ({ status: 200, body: {} }));
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user, /Ultrassom/, 'Cancelar o exame?');
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await screen.findByText('Agendamento cancelado.')).toBeVisible();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url.pathname).toBe('/api/exam-bookings/b1/cancel');
    expect(post?.body).toEqual({ startsAt: FUTURE });
  });

  it('warns before a late exam cancellation', async () => {
    serve({ upcoming: [exam('b1', { actions: late })] });
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user, /Ultrassom/, 'Cancelar o exame?');
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      'Este cancelamento ficará registrado como tardio.',
    );
  });

  it('warns before a late cancellation and sends no empty reason', async () => {
    const { calls } = serve({ upcoming: [booking('b1', { actions: late })] }, () => ({
      status: 200,
      body: {},
    }));
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      'Este cancelamento ficará registrado como tardio.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    await screen.findByText('Agendamento cancelado.');
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ startsAt: FUTURE });
  });

  it('explains a stale booking and refreshes the list on 409', async () => {
    const { calls } = serve({ upcoming: [booking('b1')] }, () => ({
      status: 409,
      body: { code: 'INVALID_STATE', message: STALE, fields: { _root: STALE } },
    }));
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    const before = listCalls(calls).length;
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(STALE);
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
    expect(dialog).toBeVisible();
    expect(within(dialog).queryByRole('button', { name: 'Cancelar agendamento' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Voltar' })).toBeVisible();
  });

  it('explains a missing booking on 404 and leaves only the way back', async () => {
    const { calls } = serve({ upcoming: [booking('b1')] }, () => ({
      status: 404,
      body: { code: 'NOT_FOUND', message: 'Consulta não encontrada.' },
    }));
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    const before = listCalls(calls).length;
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Este agendamento não existe mais. Confira a lista atualizada.',
    );
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
    expect(within(dialog).queryByRole('button', { name: 'Cancelar agendamento' })).not.toBeInTheDocument();
  });

  it('moves focus to the results line when the cancelled booking leaves the list', async () => {
    const lists: Lists = { upcoming: [booking('b1')] };
    serve(lists, () => {
      lists.upcoming = [];
      return { status: 200, body: {} };
    });
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await screen.findByText('Nada por aqui')).toBeVisible();
    await waitFor(() => expect(dialog).not.toBeVisible());
    await waitFor(() => expect(document.activeElement).toHaveAttribute('aria-live', 'polite'));
    expect(document.activeElement).toBeEmptyDOMElement();
  });

  it('clamps a page beyond the last one', async () => {
    serve({ upcoming: [booking('b1')] }, undefined, 25);
    const { router } = renderApp('/paciente/agendamentos?pagina=9');

    await waitFor(() => expect(router.state.location.search).toBe('?pagina=3'));
    expect(await screen.findByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('paginates through the URL and resets the page when the tab changes', async () => {
    const { calls } = serve({ upcoming: [booking('b1')], past: [] }, undefined, 25);
    const { user, router } = renderApp('/paciente/agendamentos');

    const pages = await screen.findByRole('navigation', { name: 'Paginação' });
    await user.click(within(pages).getByRole('button', { name: 'Página 2' }));

    expect(router.state.location.search).toBe('?pagina=2');
    await waitFor(() => expect(listCalls(calls).at(-1)?.url.searchParams.get('page')).toBe('2'));

    await user.click(screen.getByRole('tab', { name: /^Histórico/ }));
    expect(router.state.location.search).toBe('?aba=realizados');
  });

  it('shows an empty state with a way to book on each tab', async () => {
    serve({});
    const { user } = renderApp('/paciente/agendamentos');

    const list = within(await screen.findByRole('region', { name: 'Lista de agendamentos' }));
    expect(await list.findByText('Nada por aqui')).toBeVisible();
    expect(list.getByRole('link', { name: 'Agendar consulta' })).toHaveAttribute(
      'href',
      '/paciente/consultas/nova',
    );

    await user.click(screen.getByRole('tab', { name: /^Histórico/ }));

    expect(await screen.findByText('Nenhum agendamento no histórico')).toBeVisible();
  });

  describe('filter', () => {
    const openFilter = async (
      user: ReturnType<typeof renderApp>['user'],
      name: string | RegExp = /^Filtrar/,
    ) => {
      await user.click(await screen.findByRole('button', { name }));
      return screen.getByRole('dialog', { name: 'Filtrar agendamentos' });
    };

    const labels = (radios: HTMLElement[]) => radios.map((radio) => radio.closest('label')?.textContent);

    const radioLabels = (dialog: HTMLElement, group: string) =>
      labels(within(within(dialog).getByRole('group', { name: group })).getAllByRole('radio'));

    const expectAllSelected = (dialog: HTMLElement) =>
      expect(labels(within(dialog).getAllByRole('radio', { checked: true }))).toEqual(['Todos', 'Todos']);

    it('applies type and status through the URL, sends them and shows the count', async () => {
      const { calls } = serve({ upcoming: [booking('b1'), exam('b2', { status: 'pending' })] });
      const { user, router } = renderApp('/paciente/agendamentos');

      const filter = await screen.findByRole('button', { name: 'Filtrar, todos' });
      expect(filter).toHaveAttribute('aria-haspopup', 'dialog');
      const dialog = await openFilter(user);
      expectAllSelected(dialog);
      await user.click(within(dialog).getByRole('radio', { name: 'Exames' }));
      await user.click(within(dialog).getByRole('radio', { name: 'Pendente' }));
      await user.click(within(dialog).getByRole('button', { name: 'Aplicar' }));

      expect(router.state.location.search).toBe('?tipo=exame&status=pendente');
      await waitFor(() => expect(dialog).not.toBeVisible());
      expect(document.activeElement).toBe(filter);
      expect(filter).toHaveAccessibleName('Filtrar, filtros: 2 ativos');
      expect(within(filter).getByText('2')).toBeVisible();
      await waitFor(() => {
        const params = listCalls(calls).at(-1)?.url.searchParams;
        expect(params?.get('kind')).toBe('exam');
        expect(params?.get('status')).toBe('pending');
      });
      expect(await screen.findByText('1 agendamento com esses filtros')).toBeVisible();
      expect(screen.queryByRole('button', { name: /Dr\. João Silveira/ })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /^Próximos/ })).toBeVisible();
    });

    it('clears the filters from the sheet and resets the page', async () => {
      const { calls } = serve({ upcoming: [booking('b1')] }, undefined, 25);
      const { user, router } = renderApp('/paciente/agendamentos?pagina=2&tipo=consulta');

      const dialog = await openFilter(user, 'Filtrar, filtros: 1 ativo');
      expect(within(dialog).getByRole('radio', { name: 'Consultas' })).toBeChecked();
      await user.click(within(dialog).getByRole('button', { name: 'Limpar' }));

      expect(router.state.location.search).toBe('');
      expect(screen.getByRole('button', { name: 'Filtrar, todos' })).toBeVisible();
      await waitFor(() => expect(listCalls(calls).at(-1)?.url.searchParams.has('kind')).toBe(false));
    });

    it('discards an unapplied choice when the sheet is closed', async () => {
      serve({ upcoming: [booking('b1')] });
      const { user, router } = renderApp('/paciente/agendamentos');

      let dialog = await openFilter(user);
      await user.click(within(dialog).getByRole('radio', { name: 'Consultas' }));
      await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
      expect(router.state.location.search).toBe('');

      dialog = await openFilter(user);
      expectAllSelected(dialog);
    });

    it('closes with Escape without applying and returns the focus', async () => {
      serve({ upcoming: [booking('b1')] });
      const { user, router } = renderApp('/paciente/agendamentos');

      const filter = await screen.findByRole('button', { name: 'Filtrar, todos' });
      const dialog = await openFilter(user);
      await user.click(within(dialog).getByRole('radio', { name: 'Exames' }));
      await user.keyboard('{Escape}');
      act(() => (dialog as HTMLDialogElement).close());

      expect(dialog).not.toBeVisible();
      expect(document.activeElement).toBe(filter);
      expect(router.state.location.search).toBe('');
      expect(filter).toHaveAccessibleName('Filtrar, todos');
    });

    it('offers only the statuses of the open tab', async () => {
      serve({});
      const { user } = renderApp('/paciente/agendamentos');

      let dialog = await openFilter(user);
      expect(radioLabels(dialog, 'Tipo')).toEqual(['Todos', 'Consultas', 'Exames']);
      expect(radioLabels(dialog, 'Status')).toEqual(['Todos', 'Pendente', 'Confirmado']);
      await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));

      await user.click(screen.getByRole('tab', { name: /^Histórico/ }));
      dialog = await openFilter(user);
      expect(radioLabels(dialog, 'Status')).toEqual([
        'Todos',
        'Aguardando registro',
        'Concluída',
        'Cancelada',
        'Não compareceu',
        'Não confirmada',
      ]);
    });

    it('maps awaiting record to confirmed bookings in the past', async () => {
      const { calls } = serve({ past: [booking('b1', { startsAt: PAST, actions: closed })] });
      renderApp('/paciente/agendamentos?aba=realizados&status=aguardando-registro');

      expect(await screen.findByText('1 agendamento com esses filtros')).toBeVisible();
      expect(listCalls(calls).at(-1)?.url.searchParams.get('status')).toBe('confirmed');
    });

    it('ignores and removes invalid values from the URL', async () => {
      const { calls } = serve({ upcoming: [booking('b1')] });
      const { router } = renderApp('/paciente/agendamentos?tipo=cirurgia&status=concluida&aba=agendados');

      await waitFor(() => expect(router.state.location.search).toBe('?aba=agendados'));
      expect(router.state.historyAction).toBe('REPLACE');
      const params = listCalls(calls)[0]?.url.searchParams;
      expect(params?.has('kind')).toBe(false);
      expect(params?.has('status')).toBe(false);
      expect(screen.getByRole('button', { name: 'Filtrar, todos' })).toBeVisible();
    });

    it('drops a status that the new tab does not offer', async () => {
      const { calls } = serve({ upcoming: [exam('b1', { status: 'pending' })], past: [] });
      const { user, router } = renderApp('/paciente/agendamentos?tipo=exame&status=pendente');

      await screen.findByRole('button', { name: 'Filtrar, filtros: 2 ativos' });
      await user.click(screen.getByRole('tab', { name: /^Histórico/ }));

      await waitFor(() => expect(router.state.location.search).toBe('?tipo=exame&aba=realizados'));
      expect(router.state.historyAction).toBe('REPLACE');
      const params = listCalls(calls).at(-1)?.url.searchParams;
      expect(params?.get('scope')).toBe('past');
      expect(params?.get('kind')).toBe('exam');
      expect(params?.has('status')).toBe(false);
      expect(screen.getByRole('button', { name: 'Filtrar, filtros: 1 ativo' })).toBeVisible();
    });

    it('explains a filtered empty list and clears the filters from it', async () => {
      serve({ upcoming: [booking('b1')] });
      const { user, router } = renderApp('/paciente/agendamentos?tipo=exame');

      expect(await screen.findByText('Nenhum agendamento com esses filtros')).toBeVisible();
      expect(screen.getByRole('tab', { name: /^Próximos/ })).toBeVisible();
      expect(
        within(screen.getByRole('region', { name: 'Lista de agendamentos' })).queryByRole('link'),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));

      expect(router.state.location.search).toBe('');
      expect(document.activeElement).toHaveAttribute('aria-live', 'polite');
      expect(await screen.findByRole('button', { name: /Dr\. João Silveira/ })).toBeVisible();
      expect(screen.getByText('1 agendamento')).toBeVisible();
    });
  });
});
