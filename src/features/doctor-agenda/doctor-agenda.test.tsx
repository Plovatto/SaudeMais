import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { renderApp, serveApi, type ApiCall } from '@/test/render-app';
import { DESKTOP_QUERY } from '@hooks/useMediaQuery';
import { GENERIC_ERROR_MESSAGE } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import {
  actions,
  appointment,
  complete,
  confirmed,
  FUTURE,
  home,
  HOME,
  LIST,
  openComplete,
  PAST,
  posts,
  serve,
  unrecorded,
  type User,
} from './doctor-fixtures';

const DAY = '2030-01-10';
const NEXT_DAY = '2030-01-11T02:30:00.000Z';
const AFTERNOON = '2030-01-10T18:00:00.000Z';
const NOT_STARTED = 'Esta consulta ainda não começou. Registre o desfecho a partir do horário de início.';
const STALE = 'Este agendamento mudou ou não pode mais ser alterado. Confira a lista atualizada.';
const REASON = 'Informe o motivo do cancelamento.';
const REFUSE = 'Recusar pedido?';

const listUrl = (slug: string) => `/medico/agenda?aba=consultas&situacao=${slug}`;
const PENDING_URL = listUrl('a-confirmar');
const CONFIRMED_URL = listUrl('confirmadas');
const AWAITING_URL = listUrl('aguardando-registro');
const HISTORY_URL = listUrl('historico');

const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.url.pathname === LIST);
const homeCalls = (calls: ApiCall[]) => calls.filter((call) => call.url.pathname === HOME).length;
const patient = (id: string, fullName: string) => ({ patient: { id, fullName, phone: null } });

const openDetail = async (user: User, name: RegExp = /^Andreia Soares/) => {
  await user.click(await screen.findByRole('button', { name }));
  return within(screen.getByRole('dialog', { name: 'Detalhes da consulta' }));
};

const openCancel = async (user: User, title = 'Cancelar consulta?') => {
  const detail = await openDetail(user);
  await user.click(detail.getByRole('button', { name: /^(Cancelar|Recusar)/ }));
  return screen.getByRole('dialog', { name: title });
};

describe('doctor agenda', { timeout: 15_000 }, () => {
  it('shows the week with the appointments of the chosen day by period', async () => {
    const { calls } = serve({
      lists: {
        all: [
          appointment('a1'),
          confirmed('a2', { startsAt: AFTERNOON, ...patient('p2', 'Jair Oliveira') }),
          appointment('a3', { startsAt: '2030-01-12T13:00:00.000Z', ...patient('p3', 'Gilberto Souza') }),
        ],
      },
    });
    const { user, router } = renderApp(`/medico/agenda?dia=${DAY}`);

    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();
    expect(await screen.findByText('3 consultas nesta semana')).toBeVisible();
    const range = listCalls(calls)[0]?.url.searchParams;
    expect(range?.get('tab')).toBe('all');
    expect(range?.get('from')).toBe('2030-01-07');
    expect(range?.get('to')).toBe('2030-01-13');

    const week = screen.getByRole('region', { name: 'Semana' });
    const thursday = within(week).getByRole('button', { name: /10 de janeiro, 2 consultas$/ });
    expect(thursday).toHaveAttribute('aria-pressed', 'true');
    expect(within(week).getByRole('button', { name: /12 de janeiro, 1 consulta$/ })).toBeVisible();

    const day = screen.getByRole('region', { name: /^Consultas de/ });
    expect(
      within(day)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.split('·')[0]),
    ).toEqual([
      'Manhã',
      expect.stringContaining('Andreia Soares'),
      'Tarde',
      expect.stringContaining('Jair Oliveira'),
    ]);

    await user.click(within(week).getByRole('button', { name: /12 de janeiro/ }));
    expect(router.state.location.search).toBe('?dia=2030-01-12');
    expect(
      await within(screen.getByRole('region', { name: /^Consultas de/ })).findByRole('button', {
        name: /^Gilberto Souza/,
      }),
    ).toBeVisible();
  });

  it('steps between weeks and comes back to today', async () => {
    const { calls } = serve({ lists: { all: [] } });
    const { user, router } = renderApp(`/medico/agenda?dia=${DAY}`);

    expect(await screen.findByText('Nenhuma consulta neste dia')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Próxima semana' }));
    expect(router.state.location.search).toBe('?dia=2030-01-17');
    await waitFor(() => expect(listCalls(calls).at(-1)?.url.searchParams.get('from')).toBe('2030-01-14'));

    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(router.state.location.search).toBe('?dia=2030-01-03');

    await user.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('button', { current: 'date' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to the appointment list and its status chips through the URL', async () => {
    const { calls } = serve({ lists: { pending: [appointment('a1')], confirmed: [confirmed('a2')] } });
    const { user, router } = renderApp('/medico/agenda');

    await user.click(await screen.findByRole('tab', { name: /^Consultas/ }));
    expect(router.state.location.search).toBe('?aba=consultas');
    const consultas = screen.getByRole('tab', { name: 'Consultas' });
    expect(consultas).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(consultas).toHaveTextContent('Consultas2'));
    expect(await screen.findByRole('tab', { name: 'Todas 2' })).toHaveAttribute('aria-selected', 'true');
    expect(listCalls(calls).at(-1)?.url.searchParams.get('tab')).toBe('all');

    await user.click(screen.getByRole('tab', { name: 'Confirmadas 1' }));
    expect(router.state.location.search).toBe('?aba=consultas&situacao=confirmadas');
    expect(await screen.findByRole('button', { name: /^Andreia Soares/ })).toHaveTextContent('Confirmado');
    expect(listCalls(calls).at(-1)?.url.searchParams.get('tab')).toBe('confirmed');
    expect(screen.getByRole('tab', { name: 'A confirmar 1' })).toBeVisible();
  });

  it('opens the awaiting status from the URL', async () => {
    const { calls } = serve({ lists: { awaiting: [unrecorded('a1')] } });
    renderApp(AWAITING_URL);

    expect(await screen.findByRole('tab', { name: /^Aguardando registro/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByRole('button', { name: /^Andreia Soares/ })).toBeVisible();
    expect(listCalls(calls)[0]?.url.searchParams.get('tab')).toBe('awaiting');
  });

  it('searches the patient through the URL and explains an empty search', async () => {
    const { calls } = serve({ lists: {} });
    const { user, router } = renderApp(PENDING_URL);

    const search = await screen.findByRole('searchbox', { name: 'Buscar paciente' });
    await user.type(search, ' Andreia ');
    await waitFor(() => expect(router.state.location.search).toContain('busca=Andreia'));
    await waitFor(() => expect(listCalls(calls).at(-1)?.url.searchParams.get('search')).toBe('Andreia'));
    expect(await screen.findByText('Nenhuma consulta encontrada')).toBeVisible();
    expect(screen.getByText('Tente outro nome.')).toBeVisible();
  });

  it('groups the list by São Paulo day', async () => {
    serve({
      lists: {
        pending: [
          appointment('a1'),
          appointment('a2', { startsAt: NEXT_DAY, ...patient('p2', 'Jair Oliveira') }),
          appointment('a3', { startsAt: '2030-01-12T13:00:00.000Z', ...patient('p3', 'Gilberto Souza') }),
        ],
      },
    });
    renderApp(PENDING_URL);

    await screen.findByRole('button', { name: /^Gilberto Souza/ });
    const items = within(screen.getByRole('region', { name: 'Consultas' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.split('·')[0]?.trim())).toEqual([
      expect.stringMatching(/10 de janeiro/i),
      expect.stringContaining('Andreia Soares'),
      expect.stringContaining('Jair Oliveira'),
      expect.stringMatching(/12 de janeiro/i),
      expect.stringContaining('Gilberto Souza'),
    ]);
  });

  it('opens the detail in a sheet with the patient phone, notes and unit', async () => {
    serve({ lists: { pending: [appointment('a1', { notes: 'Dor no peito\nhá dois dias' })] } });
    const { user, router } = renderApp(PENDING_URL);

    expect(screen.queryByRole('complementary', { name: 'Detalhes da consulta' })).not.toBeInTheDocument();
    const detail = await openDetail(user);
    expect(router.state.location.search).toContain('consulta=a1');
    expect(detail.getByRole('link', { name: '(11) 98765-4321' })).toHaveAttribute(
      'href',
      'tel:+5511987654321',
    );
    expect(detail.getByText(/Dor no peito/)).toBeVisible();
    expect(detail.getByText('Rotina')).toBeVisible();
    expect(detail.getByText('Rua das Flores, 123')).toBeVisible();
    expect(detail.getByRole('button', { name: /^Confirmar/ })).toBeVisible();

    await user.click(detail.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(router.state.location.search).not.toContain('consulta='));
  });

  it('keeps the detail beside the list on desktop and follows the chosen row', async () => {
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    serve({
      lists: { pending: [appointment('a1'), appointment('a2', patient('p2', 'Jair Oliveira'))] },
    });
    const { user } = renderApp(PENDING_URL);

    const first = await screen.findByRole('button', { name: /^Andreia Soares/ });
    expect(first).toHaveAttribute('aria-current', 'true');
    const aside = screen.getByRole('complementary', { name: 'Detalhes da consulta' });
    expect(within(aside).getByRole('heading', { level: 2, name: /Andreia Soares/ })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /^Jair Oliveira/ }));
    expect(
      within(screen.getByRole('complementary', { name: 'Detalhes da consulta' })).getByRole('heading', {
        level: 2,
        name: /Jair Oliveira/,
      }),
    ).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a cancelled appointment without a phone link', async () => {
    serve({
      lists: {
        history: [
          appointment('a1', {
            status: 'cancelled',
            ...patient('p1', 'Andreia Soares'),
            actions: actions(),
            cancellation: { byRole: 'patient', reason: 'Viagem.', late: false, cancelledAt: PAST },
          }),
        ],
      },
    });
    const { user } = renderApp(HISTORY_URL);

    const detail = await openDetail(user);
    expect(detail.getByText('Telefone indisponível')).toBeVisible();
    expect(detail.queryByRole('link')).not.toBeInTheDocument();
    expect(detail.getByText(/^Cancelada pelo paciente em/)).toBeVisible();
    expect(detail.getByText('Motivo: Viagem.')).toBeVisible();
    expect(detail.queryByRole('button', { name: /^(Confirmar|Cancelar)/ })).not.toBeInTheDocument();
  });

  it('confirms with the start time it showed and refreshes the doctor data', async () => {
    const { calls } = serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user, queryClient } = renderApp(PENDING_URL);

    const scope = await openDetail(user);
    queryClient.setQueryData(queryKeys.doctor.home, home());
    const before = listCalls(calls).length;
    const homeBefore = homeCalls(calls);
    await user.click(scope.getByRole('button', { name: /^Confirmar/ }));

    expect(await screen.findByText('Consulta confirmada.')).toBeVisible();
    await waitFor(() => expect(homeCalls(calls)).toBeGreaterThan(homeBefore));
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/confirm');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: FUTURE });
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('explains a stale request when confirming and refreshes the list on 409', async () => {
    const { calls } = serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 409, body: { code: 'INVALID_STATE', message: 'Consulta já confirmada.' } }),
    });
    const { user } = renderApp(PENDING_URL);

    const scope = await openDetail(user);
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
    const { user } = renderApp(PENDING_URL);

    const scope = await openDetail(user);
    const results = screen.getByText('1 consulta');
    await user.click(scope.getByRole('button', { name: /^Confirmar/ }));

    expect(await screen.findByText('Nenhuma consulta encontrada')).toBeVisible();
    await waitFor(() => expect(results).toHaveFocus());
  });

  it('blocks the confirmation while it is being sent', async () => {
    serve({
      lists: {
        pending: [
          appointment('a1'),
          appointment('a2', { patient: { id: 'p2', fullName: 'Jair Oliveira', phone: null } }),
        ],
      },
      action: () => ({ status: 200, body: {} }),
    });
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    renderApp(PENDING_URL);

    const aside = within(await screen.findByRole('complementary', { name: 'Detalhes da consulta' }));
    fireEvent.click(aside.getByRole('button', { name: /^Confirmar/ }));

    await waitFor(() =>
      expect(aside.getByRole('button', { name: /^Confirmar/ })).toHaveAttribute('aria-disabled', 'true'),
    );
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
    const { user } = renderApp(AWAITING_URL);
    const first = await openDetail(user);
    expect(first.getByRole('button', { name: /^Concluir: Andreia Soares/ })).toBeVisible();
    expect(first.getByRole('button', { name: /^Não compareceu: Andreia Soares/ })).toBeVisible();
    expect(first.queryByRole('button', { name: /^(Confirmar|Cancelar)/ })).not.toBeInTheDocument();
    await user.click(first.getByRole('button', { name: 'Fechar' }));
    const second = await openDetail(user, /^Jair Oliveira/);
    expect(second.getByRole('button', { name: /^Concluir/ })).toBeVisible();
    expect(second.queryByRole('button', { name: /^Não compareceu/ })).not.toBeInTheDocument();
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
    renderApp(HISTORY_URL);
    expect(await screen.findByRole('button', { name: /^Andreia Soares/ })).toHaveTextContent('Concluída');
    expect(screen.getByRole('button', { name: /^Jair Oliveira/ })).toHaveTextContent('Não compareceu');
    expect(
      screen.queryByRole('button', { name: /^(Concluir|Não compareceu|Confirmar|Cancelar)/ }),
    ).not.toBeInTheDocument();
  });

  it('links to the patient results only from exam reviews confirmed or completed in the last 30 days', async () => {
    const review = { visitType: 'exam_review' as const, actions: actions() };
    const patient = (id: string, fullName: string) => ({ patient: { id, fullName, phone: null } });
    const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
    const recent = daysAgo(2);
    serve({
      lists: {
        history: [
          appointment('a1', { ...review, status: 'completed', startsAt: recent }),
          appointment('a2', {
            ...review,
            ...patient('p2', 'Jair Oliveira'),
            status: 'confirmed',
            startsAt: recent,
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
            startsAt: recent,
          }),
          appointment('a5', {
            ...patient('p5', 'Eva Rocha'),
            status: 'completed',
            startsAt: recent,
            actions: actions(),
          }),
          appointment('a6', {
            ...review,
            ...patient('p6', 'Fábio Reis'),
            status: 'completed',
            startsAt: daysAgo(31),
          }),
        ],
      },
    });
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    const { user } = renderApp(HISTORY_URL);

    const linkIn = async (name: string) => {
      await user.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }));
      const aside = screen.getByRole('complementary', { name: 'Detalhes da consulta' });
      return within(aside).queryByRole('link', { name: /^Ver exames do paciente/ });
    };
    for (const name of ['Carla Dias', 'Davi Lima', 'Eva Rocha', 'Fábio Reis'])
      expect(await linkIn(name)).not.toBeInTheDocument();
    const jair = await linkIn('Jair Oliveira');
    expect(jair).toHaveAttribute('href', '/medico/pacientes/p2/exames');
    expect(jair).toHaveAccessibleName(/^Ver exames do paciente: Jair Oliveira/);
    const andreia = await linkIn('Andreia Soares');
    expect(andreia).toHaveAttribute('href', '/medico/pacientes/p-a1/exames');

    serveApi(['doctor'], {
      '/api/doctor/patients/p-a1/exam-results': () => ({
        status: 200,
        body: { items: [], page: 1, pageSize: 10, total: 0 },
      }),
    });
    await user.click(andreia as HTMLElement);
    expect(await screen.findByRole('heading', { level: 1, name: 'Exames de Andreia Soares' })).toBeVisible();
  });

  it('completes with the start time it showed and refreshes the doctor data', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user, queryClient } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    queryClient.setQueryData(queryKeys.doctor.home, home());
    const before = listCalls(calls).length;
    const homeBefore = homeCalls(calls);
    await complete(user, scope);
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
    await waitFor(() => expect(homeCalls(calls)).toBeGreaterThan(homeBefore));
    expect(posts(calls)[0]?.url.pathname).toBe('/api/appointments/a1/complete');
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST });
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('sends the pressure and the weight with a decimal comma when completing', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const dialog = await openComplete(user, scope);
    expect(screen.getByRole('dialog', { name: 'Concluir consulta' })).toHaveAccessibleDescription(
      /^Andreia Soares, .+\. Registre a pressão e o peso medidos na consulta, se houver; os campos são opcionais\.$/,
    );
    expect(dialog.getByRole('group', { name: 'Pressão arterial' })).toBeVisible();
    const systolic = dialog.getByRole('textbox', { name: 'Sistólica (mmHg)' });
    const weight = dialog.getByRole('textbox', { name: 'Peso (kg)' });
    expect(systolic).toHaveAttribute('inputmode', 'numeric');
    expect(weight).toHaveAttribute('inputmode', 'decimal');
    await waitFor(() => expect(systolic).toHaveFocus());
    await user.type(systolic, '120');
    await user.type(dialog.getByRole('textbox', { name: 'Diastólica (mmHg)' }), '80');
    await user.type(weight, ' 72,450 ');
    await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
    expect(posts(calls)[0]?.body).toEqual({
      startsAt: PAST,
      metrics: { systolic: 120, diastolic: 80, weightKg: 72.45 },
    });
  });

  it('sends only the weight when the pressure is left empty', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const dialog = await openComplete(user, scope);
    await user.type(dialog.getByRole('textbox', { name: 'Peso (kg)' }), '80.25');
    await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
    expect(posts(calls)[0]?.body).toEqual({ startsAt: PAST, metrics: { weightKg: 80.25 } });
  });

  const METRIC_LABELS = { systolic: 'Sistólica (mmHg)', diastolic: 'Diastólica (mmHg)', weight: 'Peso (kg)' };

  it.each<[string, Partial<Record<keyof typeof METRIC_LABELS, string>>, keyof typeof METRIC_LABELS, string]>([
    [
      'an incomplete pressure',
      { systolic: '120' },
      'diastolic',
      'Informe a diastólica junto com a sistólica.',
    ],
    [
      'a diastolic without systolic',
      { diastolic: '80' },
      'systolic',
      'Informe a sistólica junto com a diastólica.',
    ],
    [
      'a systolic out of range',
      { systolic: '400', diastolic: '80' },
      'systolic',
      'A sistólica vai de 50 a 300 mmHg.',
    ],
    [
      'a diastolic out of range',
      { systolic: '120', diastolic: '20' },
      'diastolic',
      'A diastólica vai de 30 a 200 mmHg.',
    ],
    [
      'a decimal systolic',
      { systolic: '120,5', diastolic: '80' },
      'systolic',
      'Informe a sistólica em mmHg, sem casas decimais.',
    ],
    [
      'an inverted pressure',
      { systolic: '80', diastolic: '90' },
      'systolic',
      'A sistólica precisa ser maior que a diastólica.',
    ],
    ['a weight out of range', { weight: '501' }, 'weight', 'O peso vai de 1 a 500 kg.'],
    ['a weight that is not a number', { weight: 'abc' }, 'weight', 'Informe o peso em kg.'],
    [
      'a weight with three decimals',
      { weight: '72,456' },
      'weight',
      'Informe o peso com no máximo duas casas decimais.',
    ],
  ])('blocks %s and focuses the field with the error', async (_case, values, field, message) => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const dialog = await openComplete(user, scope);
    for (const [key, value] of Object.entries(values))
      await user.type(dialog.getByRole('textbox', { name: METRIC_LABELS[key as typeof field] }), value);
    await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));
    const input = dialog.getByRole('textbox', { name: METRIC_LABELS[field] });
    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveAccessibleDescription(expect.stringContaining(message));
    expect(input).toBeInvalid();
    expect(posts(calls)).toHaveLength(0);
  });

  it('shows the field error from the API in the dialog', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos.',
          fields: { 'metrics.weightKg': 'O peso vai de 1 a 500 kg.' },
        },
      }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const dialog = await openComplete(user, scope);
    const weight = dialog.getByRole('textbox', { name: 'Peso (kg)' });
    await user.type(weight, '72');
    await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));
    await waitFor(() => expect(weight).toHaveFocus());
    expect(weight).toHaveAccessibleDescription(expect.stringContaining('O peso vai de 1 a 500 kg.'));
    expect(posts(calls)).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Concluir consulta' })).toBeVisible();
    expect(screen.queryByText('Dados inválidos.')).not.toBeInTheDocument();
  });

  it('shows every metric error at once and focuses the first one', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const dialog = await openComplete(user, scope);
    await user.type(dialog.getByRole('textbox', { name: 'Sistólica (mmHg)' }), '120');
    await user.type(dialog.getByRole('textbox', { name: 'Peso (kg)' }), '72,456');
    await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));
    const diastolic = dialog.getByRole('textbox', { name: 'Diastólica (mmHg)' });
    await waitFor(() => expect(diastolic).toHaveFocus());
    expect(diastolic).toHaveAccessibleDescription('Informe a diastólica junto com a sistólica.');
    expect(dialog.getByRole('textbox', { name: 'Peso (kg)' })).toHaveAccessibleDescription(
      expect.stringContaining('Informe o peso com no máximo duas casas decimais.'),
    );
    expect(posts(calls)).toHaveLength(0);
  });

  it('keeps the dialog open with an alert after a server error', async () => {
    serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'x' } }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const dialog = await complete(user, scope);
    expect(await dialog.findByRole('alert')).toHaveTextContent(GENERIC_ERROR_MESSAGE);
    expect(screen.getByRole('dialog', { name: 'Concluir consulta' })).toBeVisible();
    expect(screen.getAllByRole('alert').filter((alert) => alert.textContent !== '')).toHaveLength(1);
    await waitFor(() => expect(dialog.getByRole('textbox', { name: 'Peso (kg)' })).toBeEnabled());
    expect(dialog.getByRole('button', { name: 'Voltar' })).toBeEnabled();
    expect(dialog.getByRole('button', { name: 'Concluir consulta' })).not.toHaveAttribute('aria-disabled');
  });

  it('asks before registering a no-show and sends it only after the confirmation', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
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
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const before = listCalls(calls).length;
    await complete(user, scope);
    expect(await screen.findByText(NOT_STARTED)).toBeVisible();
    expect(screen.queryByText('A consulta ainda não começou.')).not.toBeInTheDocument();
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('explains a stale outcome, closes the confirmation and refreshes the list on 409', async () => {
    const { calls } = serve({
      lists: { awaiting: [unrecorded('a1')] },
      action: () => ({ status: 409, body: { code: 'INVALID_STATE', message: 'Consulta já registrada.' } }),
    });
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
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
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    await complete(user, scope);
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
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const results = screen.getByText('1 consulta');
    await user.click(scope.getByRole('button', { name: /^Não compareceu/ }));
    await user.click(screen.getByRole('button', { name: 'Registrar falta' }));
    expect(await screen.findByText('Nenhuma consulta encontrada')).toBeVisible();
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
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
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
    const { user } = renderApp(AWAITING_URL);
    const scope = await openDetail(user);
    const results = screen.getByText('1 consulta');
    await complete(user, scope);
    expect(await screen.findByText(STALE)).toBeVisible();
    expect(await screen.findByText('Nenhuma consulta encontrada')).toBeVisible();
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
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    renderApp(AWAITING_URL);
    const aside = within(await screen.findByRole('complementary', { name: 'Detalhes da consulta' }));
    fireEvent.click(aside.getByRole('button', { name: /^Concluir/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir consulta' }));
    await waitFor(() => {
      expect(aside.getByRole('button', { name: /^Concluir/ })).toHaveAttribute('aria-disabled', 'true');
      expect(aside.getByRole('button', { name: /^Não compareceu/ })).toBeDisabled();
    });
    expect(await screen.findByText('Consulta concluída.')).toBeVisible();
  });

  it('requires a reason before cancelling', async () => {
    const { calls } = serve({
      lists: { pending: [appointment('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(PENDING_URL);

    const dialog = await openCancel(user, REFUSE);
    expect(within(dialog).getByText(/^Rotina com Andreia Soares em/)).toBeVisible();
    const reason = within(dialog).getByRole('textbox', { name: 'Motivo' });
    expect(reason).toBeRequired();
    await user.type(reason, '   ');
    await user.click(within(dialog).getByRole('button', { name: 'Recusar pedido' }));

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
    const { user } = renderApp(PENDING_URL);

    const dialog = await openCancel(user, REFUSE);
    await user.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'Imprevisto');
    await user.click(within(dialog).getByRole('button', { name: 'Recusar pedido' }));

    expect(await within(dialog).findByText(REASON)).toBeVisible();
    expect(within(dialog).getByRole('textbox', { name: 'Motivo' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('cancels with a multi-line reason and refreshes the list', async () => {
    const { calls } = serve({
      lists: { confirmed: [confirmed('a1')] },
      action: () => ({ status: 200, body: {} }),
    });
    const { user } = renderApp(CONFIRMED_URL);

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
    const { user } = renderApp(PENDING_URL);

    const dialog = await openCancel(user, REFUSE);
    await user.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'Imprevisto');
    await user.click(within(dialog).getByRole('button', { name: 'Recusar pedido' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Este agendamento não existe mais. Confira a lista atualizada.',
    );
    expect(within(dialog).queryByRole('button', { name: 'Recusar pedido' })).not.toBeInTheDocument();
  });

  it('paginates through the URL and resets the page when the tab changes', async () => {
    const { calls } = serve({ lists: { pending: [appointment('a1')] }, totals: { pending: 25 } });
    const { user, router } = renderApp(PENDING_URL);

    expect(await screen.findByText('25 consultas')).toBeVisible();
    const pages = screen.getByRole('navigation', { name: 'Paginação' });
    await user.click(within(pages).getByRole('button', { name: 'Página 2' }));

    expect(router.state.location.search).toBe('?aba=consultas&situacao=a-confirmar&pagina=2');
    await waitFor(() => expect(listCalls(calls).at(-1)?.url.searchParams.get('page')).toBe('2'));

    await user.click(screen.getByRole('tab', { name: /^Confirmadas/ }));
    expect(router.state.location.search).toBe('?aba=consultas&situacao=confirmadas');
  });

  it('shows an empty state for each status', async () => {
    serve({});
    const { user } = renderApp(PENDING_URL);

    expect(await screen.findByText('Nenhuma consulta encontrada')).toBeVisible();
    expect(screen.getByText('Não há consultas com essa situação.')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: /^Confirmadas/ }));
    expect(await screen.findByText('Não há consultas com essa situação.')).toBeVisible();
  });
});
