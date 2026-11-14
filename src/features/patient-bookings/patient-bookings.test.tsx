import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, serveApi, type ApiCall, type MockResponse } from '@/test/render-app';
import type { PatientBooking } from '@lib/api/models';

const FUTURE = '2030-01-10T13:00:00.000Z';
const PAST = '2020-01-10T13:00:00.000Z';
const LIST = '/api/patient/bookings';
const STALE = 'Este agendamento mudou ou não pode mais ser alterado. Confira a lista atualizada.';

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
  actions: { canCancel: true, lateCancellation: false, cancelBlockedReason: null },
  cancellation: null,
  ...overrides,
});

const closed = { canCancel: false, lateCancellation: false, cancelBlockedReason: 'closed' } as const;

type Lists = Partial<Record<'upcoming' | 'past', PatientBooking[]>>;

const serve = (lists: Lists, cancel?: () => MockResponse, total?: number) =>
  serveApi(['patient'], {
    [LIST]: (_method, _body, url) => {
      const items = lists[url.searchParams.get('scope') as 'upcoming' | 'past'] ?? [];
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
    ...(cancel && { '/api/appointments/b1/cancel': cancel }),
  });

const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.url.pathname === LIST);

const card = async (name: RegExp) => {
  const header = await screen.findByRole('button', { name });
  return { header, scope: within(header.closest('li') as HTMLElement) };
};

const openCancel = async (user: ReturnType<typeof renderApp>['user']) => {
  const { header, scope } = await card(/Dr\. João Silveira/);
  await user.click(header);
  await user.click(scope.getByRole('button', { name: /^Cancelar/ }));
  return screen.getByRole('dialog', { name: 'Cancelar consulta?' });
};

describe('patient bookings', { timeout: 15_000 }, () => {
  it('switches between the upcoming and past tabs through the URL', async () => {
    const { calls } = serve({
      upcoming: [booking('b1')],
      past: [booking('b2', { status: 'completed', startsAt: PAST, actions: closed })],
    });
    const { user, router } = renderApp('/paciente/agendamentos');

    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas consultas e exames' })).toBeVisible();
    const upcoming = await screen.findByRole('tab', { name: /^1 Agendados$/ });
    expect(upcoming).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Confirmado')).toBeVisible();
    expect(listCalls(calls)[0]?.url.searchParams.get('scope')).toBe('upcoming');

    await user.click(screen.getByRole('tab', { name: /^1 Realizados$/ }));

    expect(router.state.location.search).toBe('?aba=realizados');
    expect(screen.queryByText('Confirmado')).not.toBeInTheDocument();
    expect(await screen.findByText('Concluída')).toBeVisible();
    expect(screen.getByRole('tab', { name: /^1 Realizados$/ })).toHaveAttribute('aria-selected', 'true');
    expect(listCalls(calls).at(-1)?.url.searchParams.get('scope')).toBe('past');
  });

  it('opens the past tab from the URL', async () => {
    serve({ past: [booking('b2', { status: 'completed', startsAt: PAST, actions: closed })] });
    renderApp('/paciente/agendamentos?aba=realizados');

    expect(await screen.findByRole('tab', { name: /Realizados/ })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Concluída')).toBeVisible();
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

    const headers = await screen.findAllByRole('button', { name: /Dr\. João Silveira/ });
    headers.forEach((header, index) =>
      expect(within(header).getByText(statuses[index]?.[1] ?? '')).toBeVisible(),
    );
  });

  it('expands and collapses a booking card', async () => {
    serve({ upcoming: [booking('b1', { notes: 'Consulta de rotina' })] });
    const { user } = renderApp('/paciente/agendamentos');

    const { header, scope } = await card(/Dr\. João Silveira/);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(scope.getByText('Rua das Flores, 123')).not.toBeVisible();
    expect(header.closest('h2')).toBeInTheDocument();

    await user.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(scope.getByText('Rua das Flores, 123')).toBeVisible();
    expect(scope.getByRole('link', { name: '(11) 3333-4444' })).toHaveAttribute('href', 'tel:+551133334444');
    expect(scope.getByText('Consulta de rotina')).toBeVisible();
    expect(header).not.toContainElement(scope.getByRole('button', { name: /^Cancelar/ }));

    await user.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(scope.getByText('Rua das Flores, 123')).not.toBeVisible();
  });

  it('shows who cancelled, the reason and the late flag', async () => {
    serve({
      past: [
        booking('b1', {
          status: 'cancelled',
          actions: closed,
          cancellation: { byRole: 'doctor', reason: 'Imprevisto.', late: true, cancelledAt: PAST },
        }),
        booking('b2', {
          kind: 'exam',
          doctor: null,
          specialty: null,
          examType: { id: 'e1', name: 'Ultrassom' },
          publicCode: 'EX-123',
          unit: { id: 'u2', name: 'Lab. Central', address: 'Rua B, 2', phone: '+551133335555' },
          actions: { canCancel: false, lateCancellation: false, cancelBlockedReason: 'unavailable' },
        }),
      ],
    });
    const { user } = renderApp('/paciente/agendamentos?aba=realizados');

    const doctor = await card(/Dr\. João Silveira/);
    await user.click(doctor.header);
    expect(doctor.scope.getByText(/^Cancelada pelo médico em/)).toBeVisible();
    expect(doctor.scope.getByText('Motivo: Imprevisto.')).toBeVisible();
    expect(doctor.scope.getByText('Cancelamento tardio')).toBeVisible();
    expect(doctor.scope.queryByRole('button', { name: /^Cancelar/ })).not.toBeInTheDocument();

    const exam = await card(/Lab\. Central/);
    expect(within(exam.header).getByText('Exame · Ultrassom')).toBeVisible();
    await user.click(exam.header);
    expect(exam.scope.getByText('EX-123')).toBeVisible();
    expect(exam.scope.getByText('Para cancelar este exame, ligue para a unidade.')).toBeVisible();
  });

  it('cancels a booking with an optional reason and refreshes the list', async () => {
    const { calls } = serve({ upcoming: [booking('b1')] }, () => ({ status: 200, body: {} }));
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    expect(within(dialog).getByText(/^Consulta de Cardiologia com Dr\. João Silveira em/)).toBeVisible();
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

  it('warns before a late cancellation and sends no empty reason', async () => {
    const { calls } = serve(
      {
        upcoming: [
          booking('b1', { actions: { canCancel: true, lateCancellation: true, cancelBlockedReason: null } }),
        ],
      },
      () => ({ status: 200, body: {} }),
    );
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

  it('moves focus to the results line when the cancelled card leaves the list', async () => {
    const lists: Lists = { upcoming: [booking('b1')] };
    serve(lists, () => {
      lists.upcoming = [];
      return { status: 200, body: {} };
    });
    const { user } = renderApp('/paciente/agendamentos');

    const dialog = await openCancel(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }));

    expect(await screen.findByText('Nenhum agendamento futuro')).toBeVisible();
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

    await user.click(screen.getByRole('tab', { name: /Realizados/ }));
    expect(router.state.location.search).toBe('?aba=realizados');
  });

  it('shows an empty state with booking shortcuts on each tab', async () => {
    serve({});
    const { user } = renderApp('/paciente/agendamentos');

    expect(await screen.findByText('Nenhum agendamento futuro')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Nova Consulta' })).toHaveAttribute(
      'href',
      '/paciente/consultas/nova',
    );
    expect(screen.getByRole('link', { name: 'Novo Exame' })).toHaveAttribute('href', '/paciente/exames/novo');

    await user.click(screen.getByRole('tab', { name: /Realizados/ }));

    expect(await screen.findByText('Nenhum agendamento realizado')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Nova Consulta' })).toBeVisible();
  });
});
