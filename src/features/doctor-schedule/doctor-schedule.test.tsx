import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DESKTOP_QUERY } from '@hooks/useMediaQuery';
import { addDays, todayInSaoPaulo } from '@lib/date';
import { stubMatchMedia } from '@/test/match-media';
import { renderApp, serveApi, type ApiRoute, type MockResponse } from '@/test/render-app';

const PATH = '/api/doctor/schedule';
const TIME_OFF = '/api/doctor/time-off';
const PAGE = '/medico/disponibilidade';

const unitHours = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, openMin: 420, closeMin: 1140 }));

const schedule = {
  appointmentDurationMin: 30,
  specialtyDurationMin: 30,
  isSpecialtyDefault: true,
  days: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isActive: weekday === 1 || weekday === 2,
    ranges:
      weekday === 1
        ? [{ startMin: 480, endMin: 720 }]
        : weekday === 2
          ? [
              { startMin: 480, endMin: 720 },
              { startMin: 780, endMin: 1020 },
            ]
          : [],
  })),
  unitHours,
};

type Schedule = typeof schedule;
type Day = Schedule['days'][number];

const withDays = (days: Record<number, Omit<Day, 'weekday'>>, base: Partial<Schedule> = {}) => ({
  ...schedule,
  ...base,
  days: schedule.days.map((entry) => ({ ...entry, ...days[entry.weekday] })),
});

const hourly = (from: number, count: number) =>
  Array.from({ length: count }, (_value, index) => ({
    startMin: (from + index) * 60,
    endMin: (from + index + 1) * 60,
  }));

const blocked = [
  { date: '2026-12-24', reason: 'Véspera de Natal' },
  { date: '2026-12-25', reason: null },
];

const savedEcho =
  (warnings: unknown[] = []) =>
  (body: unknown) => ({
    status: 200,
    body: { ...schedule, ...(body as Partial<Schedule>), warnings },
  });

interface ServeOptions {
  save?: (body: unknown) => MockResponse;
  loaded?: Schedule;
  timeOff?: ApiRoute;
  extra?: Record<string, ApiRoute>;
}

const serve = ({
  save = () => ({ status: 500 }),
  loaded = schedule,
  timeOff,
  extra = {},
}: ServeOptions = {}) =>
  serveApi(['doctor'], {
    [PATH]: (method, body) => (method === 'PUT' ? save(body) : { status: 200, body: loaded }),
    [TIME_OFF]: timeOff ?? (() => ({ status: 200, body: [] })),
    ...extra,
  });

const day = async (name: string) =>
  within((await screen.findByRole('heading', { level: 2, name })).closest('section') as HTMLElement);

const expand = async (user: ReturnType<typeof renderApp>['user'], name: string) => {
  const card = await day(name);
  await user.click(card.getByRole('button', { name: `Ver horários de ${name.toLowerCase()}` }));
  return card;
};

const saveButton = () => screen.getByRole('button', { name: 'Salvar' });

const savedBody = (calls: ReturnType<typeof serve>['calls']) =>
  calls.find((call) => call.method === 'PUT')?.body as
    (Partial<Schedule> & Pick<Schedule, 'days'>) | undefined;

const timeOffCard = async () =>
  within(
    (await screen.findByRole('heading', { level: 2, name: 'Folgas e bloqueios' })).closest(
      'section',
    ) as HTMLElement,
  );

describe('doctor schedule', { timeout: 15_000 }, () => {
  it('lists the days from monday to sunday with their periods and status', async () => {
    serve();
    renderApp(PAGE);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Horários de atendimento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Os pacientes só veem horários livres dentro destes períodos.'),
    ).toBeInTheDocument();
    await screen.findAllByRole('switch');
    const days = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
      .filter((name) => name !== 'Consultas' && name !== 'Folgas e bloqueios');
    expect(days).toEqual([
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
      'Domingo',
    ]);
    const monday = await day('Segunda-feira');
    expect(monday.getByRole('switch', { name: 'Atender às segundas-feiras' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(monday.getByText('Ativo')).toBeInTheDocument();
    expect(monday.getByText(/08:00–12:00/).closest('p')).toHaveTextContent('08:00–12:00 · 4 h');
    const tuesday = await day('Terça-feira');
    expect(tuesday.getByText(/08:00–12:00/).closest('p')).toHaveTextContent('08:00–12:00, 13:00–17:00 · 8 h');
    const saturday = await day('Sábado');
    expect(saturday.getByRole('switch', { name: 'Atender aos sábados' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(saturday.getByText('Sem atendimento')).toBeInTheDocument();
    expect(saturday.getByText('Inativo')).toBeInTheDocument();
    expect(saturday.queryByRole('button', { name: /horários de sábado/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument();
    const nav = within(screen.getAllByRole('navigation', { name: 'Menu' })[0] as HTMLElement);
    expect(nav.getByRole('link', { name: 'Horários de atendimento' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps the days collapsed until the doctor opens one', async () => {
    serve();
    const { user } = renderApp(PAGE);
    const monday = await day('Segunda-feira');
    const toggle = monday.getByRole('button', { name: 'Ver horários de segunda-feira' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(monday.queryByRole('combobox')).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Fechar horários de segunda-feira');
    expect(monday.getByRole('combobox', { name: 'Segunda-feira, início do período 1' })).toHaveValue('480');
    expect(monday.getByRole('combobox', { name: 'Segunda-feira, fim do período 1' })).toHaveValue('720');
    expect(monday.getByRole('button', { name: 'Remover período de 08:00 às 12:00' })).toBeInTheDocument();
    expect(monday.getByText('Unidade aberta 07:00–19:00')).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(monday.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('turns a day on with a first period and saves it from the phone bar', async () => {
    const { calls } = serve({ save: savedEcho() });
    const { user } = renderApp(PAGE);
    const wednesday = await day('Quarta-feira');

    await user.click(wednesday.getByRole('switch', { name: 'Atender às quartas-feiras' }));

    expect(wednesday.getByRole('button', { name: 'Fechar horários de quarta-feira' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(wednesday.getByRole('combobox', { name: 'Quarta-feira, início do período 1' })).toHaveValue('420');
    expect(wednesday.getByText(/07:00–11:00/).closest('p')).toHaveTextContent('07:00–11:00 · 4 h');
    expect(screen.getByText('Seus horários')).toBeInTheDocument();
    expect(screen.getByText('32 horários por semana')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar horários' })).not.toBeInTheDocument();

    await user.click(saveButton());

    expect(await screen.findByText('Horários salvos.')).toBeInTheDocument();
    const body = savedBody(calls);
    expect(body?.days).toHaveLength(7);
    expect(body?.days[3]).toEqual({ weekday: 3, isActive: true, ranges: [{ startMin: 420, endMin: 660 }] });
    expect(body).not.toHaveProperty('appointmentDurationMin');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument());
  });

  it('turns a day off and hides its periods while keeping them in the request', async () => {
    const { calls } = serve({ save: savedEcho() });
    const { user } = renderApp(PAGE);
    const monday = await expand(user, 'Segunda-feira');

    await user.click(monday.getByRole('switch', { name: 'Atender às segundas-feiras' }));

    expect(monday.getByText('Sem atendimento')).toBeInTheDocument();
    expect(monday.queryByRole('combobox')).not.toBeInTheDocument();
    expect(monday.queryByRole('button', { name: /horários de segunda-feira/ })).not.toBeInTheDocument();
    await user.click(saveButton());

    expect(await screen.findByText('Horários salvos.')).toBeInTheDocument();
    expect(savedBody(calls)?.days[1]).toEqual({
      weekday: 1,
      isActive: false,
      ranges: [{ startMin: 480, endMin: 720 }],
    });
  });

  it('adds a period, focuses it and saves from the header on the desktop', async () => {
    stubMatchMedia((query) => query === DESKTOP_QUERY);
    const { calls } = serve({ save: savedEcho() });
    const { user } = renderApp(PAGE);
    const monday = await expand(user, 'Segunda-feira');
    expect(screen.queryByRole('button', { name: 'Salvar horários' })).not.toBeInTheDocument();

    await user.click(monday.getByRole('button', { name: 'Adicionar período' }));
    expect(monday.getByRole('combobox', { name: 'Segunda-feira, início do período 2' })).toHaveFocus();
    await user.selectOptions(
      monday.getByRole('combobox', { name: 'Segunda-feira, fim do período 2' }),
      '1080',
    );

    expect(monday.getByText(/08:00–12:00/).closest('p')).toHaveTextContent('08:00–12:00, 12:00–18:00 · 10 h');
    expect(screen.queryByText('Seus horários')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar horários' }));

    expect(await screen.findByText('Horários salvos.')).toBeInTheDocument();
    expect(savedBody(calls)?.days[1]).toEqual({
      weekday: 1,
      isActive: true,
      ranges: [
        { startMin: 480, endMin: 720 },
        { startMin: 720, endMin: 1080 },
      ],
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Salvar horários' })).not.toBeInTheDocument(),
    );
  });

  it('removes a period, keeps the focus in the day and shows the warnings after saving', async () => {
    const { calls } = serve({
      save: savedEcho([{ appointmentId: 'a1', startsAt: '2026-11-24T17:00:00.000Z' }]),
    });
    const { user } = renderApp(PAGE);
    const tuesday = await expand(user, 'Terça-feira');

    await user.click(tuesday.getByRole('button', { name: 'Remover período de 13:00 às 17:00' }));
    expect(tuesday.getByRole('button', { name: 'Adicionar período' })).toHaveFocus();
    expect(tuesday.getByText(/08:00–12:00/).closest('p')).toHaveTextContent('08:00–12:00 · 4 h');
    await user.click(saveButton());

    expect(await screen.findByText('Horários salvos.')).toBeInTheDocument();
    expect(savedBody(calls)?.days[2]).toEqual({
      weekday: 2,
      isActive: true,
      ranges: [{ startMin: 480, endMin: 720 }],
    });
    expect(
      screen.getByText(
        '1 consulta futura ficou fora dos novos períodos: 24/11/2026, 14:00. Nada foi cancelado; confira cada uma na sua agenda.',
      ),
    ).toHaveAttribute('role', 'alert');
  });

  it('opens the day with an invalid period and focuses it before saving', async () => {
    const { calls } = serve();
    const { user } = renderApp(PAGE);
    const monday = await expand(user, 'Segunda-feira');
    await user.selectOptions(
      monday.getByRole('combobox', { name: 'Segunda-feira, início do período 1' }),
      '780',
    );
    await user.click(monday.getByRole('button', { name: 'Fechar horários de segunda-feira' }));

    await user.click(saveButton());

    const message = await monday.findByText('O fim precisa ser depois do início.');
    const start = monday.getByRole('combobox', { name: 'Segunda-feira, início do período 1' });
    expect(monday.getByRole('button', { name: 'Fechar horários de segunda-feira' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await waitFor(() => expect(start).toHaveFocus());
    expect(start).toHaveAttribute('aria-invalid', 'true');
    expect(start.getAttribute('aria-describedby')).toBe(message.id);
    expect(monday.getByRole('combobox', { name: 'Segunda-feira, fim do período 1' })).toHaveAttribute(
      'aria-describedby',
      message.id,
    );
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });

  it('opens an inactive day whose stored periods the API rejects', async () => {
    serve({
      save: () => ({
        status: 422,
        body: {
          code: 'OUTSIDE_UNIT_HOURS',
          message: 'Este período fica fora do horário da unidade.',
          fields: { 'days.4.ranges.1.endMin': 'Este período fica fora do horário da unidade.' },
        },
      }),
      loaded: withDays({ 4: { isActive: false, ranges: hourly(8, 2) } }),
    });
    const { user } = renderApp(PAGE);
    const thursday = await day('Quinta-feira');
    expect(thursday.queryByRole('button', { name: /horários de quinta-feira/ })).not.toBeInTheDocument();
    await user.click((await day('Sábado')).getByRole('switch', { name: 'Atender aos sábados' }));

    await user.click(saveButton());

    const message = await thursday.findByText('Este período fica fora do horário da unidade.');
    const start = thursday.getByRole('combobox', { name: 'Quinta-feira, início do período 2' });
    await waitFor(() => expect(start).toHaveFocus());
    expect(start).toHaveAttribute('aria-describedby', message.id);
    expect(thursday.getByRole('combobox', { name: 'Quinta-feira, início do período 1' })).not.toHaveAttribute(
      'aria-invalid',
    );
    expect(thursday.getByRole('list', { name: 'Períodos de quinta-feira' })).toHaveClass('opacity-75');
  });

  it('maps an API error to the right row of an unsorted day', async () => {
    serve({
      save: () => ({
        status: 422,
        body: {
          code: 'OVERLAP',
          message: 'Este período se sobrepõe a outro do mesmo dia.',
          fields: { 'days.2.ranges.1': 'Este período se sobrepõe a outro do mesmo dia.' },
        },
      }),
      loaded: withDays({
        2: {
          isActive: true,
          ranges: [
            { startMin: 780, endMin: 1020 },
            { startMin: 480, endMin: 720 },
          ],
        },
      }),
    });
    const { user } = renderApp(PAGE);
    const tuesday = await day('Terça-feira');
    expect(tuesday.getByText(/08:00–12:00/).closest('p')).toHaveTextContent('08:00–12:00, 13:00–17:00 · 8 h');
    await user.click((await day('Sábado')).getByRole('switch', { name: 'Atender aos sábados' }));

    await user.click(saveButton());

    const message = await tuesday.findByText('Este período se sobrepõe a outro do mesmo dia.');
    const second = tuesday.getByRole('combobox', { name: 'Terça-feira, início do período 2' });
    expect(second).toHaveValue('480');
    expect(second).toHaveAttribute('aria-describedby', message.id);
    await waitFor(() => expect(second).toHaveFocus());
  });

  it('clears an overlap error once the other period of the day is fixed', async () => {
    serve();
    const { user } = renderApp(PAGE);
    const tuesday = await expand(user, 'Terça-feira');

    await user.selectOptions(
      tuesday.getByRole('combobox', { name: 'Terça-feira, início do período 2' }),
      '660',
    );
    await user.click(saveButton());
    expect(await tuesday.findByText('Este período se sobrepõe a outro do mesmo dia.')).toBeInTheDocument();

    await user.selectOptions(tuesday.getByRole('combobox', { name: 'Terça-feira, fim do período 1' }), '660');

    await waitFor(() =>
      expect(tuesday.queryByText('Este período se sobrepõe a outro do mesmo dia.')).not.toBeInTheDocument(),
    );
    expect(tuesday.getByRole('combobox', { name: 'Terça-feira, início do período 2' })).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('offers no new period once the day reaches the unit closing time', async () => {
    serve({ loaded: withDays({ 1: { isActive: true, ranges: [{ startMin: 480, endMin: 1140 }] } }) });
    const { user } = renderApp(PAGE);
    const monday = await expand(user, 'Segunda-feira');

    expect(monday.getByRole('button', { name: 'Adicionar período' })).toBeDisabled();
  });

  it('keeps stored periods of a closed unit day removable without offering new ones', async () => {
    serve({ loaded: withDays({ 0: { isActive: true, ranges: [{ startMin: 480, endMin: 720 }] } }) });
    const { user } = renderApp(PAGE);
    const sunday = await expand(user, 'Domingo');

    expect(sunday.getByText('A unidade não abre neste dia.')).toBeInTheDocument();
    expect(sunday.queryByRole('button', { name: 'Adicionar período' })).not.toBeInTheDocument();
    await user.click(sunday.getByRole('button', { name: 'Remover período de 08:00 às 12:00' }));

    expect(sunday.getByText('Nenhum período configurado')).toBeInTheDocument();
    expect(sunday.getByRole('switch', { name: 'Atender aos domingos' })).toHaveFocus();
  });

  it('moves the focus to the previous row when a full day still offers no new period', async () => {
    serve({ loaded: withDays({ 5: { isActive: true, ranges: hourly(7, 12) } }) });
    const { user } = renderApp(PAGE);
    const friday = await expand(user, 'Sexta-feira');
    expect(friday.getByRole('button', { name: 'Adicionar período' })).toBeDisabled();

    await user.click(friday.getByRole('button', { name: 'Remover período de 09:00 às 10:00' }));

    expect(friday.getAllByRole('button', { name: /^Remover período/ })).toHaveLength(11);
    expect(friday.getByRole('button', { name: 'Adicionar período' })).toBeDisabled();
    expect(friday.getByRole('button', { name: 'Remover período de 08:00 às 09:00' })).toHaveFocus();
  });

  it('changes the appointment duration, the weekly count and the saved body', async () => {
    const { calls } = serve({ save: savedEcho() });
    const { user } = renderApp(PAGE);
    const consultas = within(
      (await screen.findByRole('heading', { level: 2, name: 'Consultas' })).closest('section') as HTMLElement,
    );
    expect(consultas.getByText('24 horários')).toBeInTheDocument();

    await user.click(consultas.getByRole('button', { name: /^Duração de cada consulta/ }));
    const options = within(screen.getByRole('listbox', { name: 'Duração de cada consulta' })).getAllByRole(
      'option',
    );
    expect(options.map((option) => option.textContent)).toEqual([
      '15 minutos4 consultas por hora',
      '20 minutos3 consultas por hora',
      '30 minutos2 consultas por hora · Padrão da especialidade',
      '45 minutosPara consultas longas',
      '60 minutos1 consulta por hora',
    ]);
    await user.click(screen.getByRole('option', { name: /^20 minutos/ }));

    expect(consultas.getByText('36 horários')).toBeInTheDocument();
    expect(screen.getByText('36 horários por semana')).toBeInTheDocument();
    await user.click(saveButton());

    expect(await screen.findByText('Horários salvos.')).toBeInTheDocument();
    expect(savedBody(calls)?.appointmentDurationMin).toBe(20);
  });

  it('returns to the specialty duration by sending null', async () => {
    const { calls } = serve({
      save: savedEcho(),
      loaded: withDays({}, { appointmentDurationMin: 45, isSpecialtyDefault: false }),
    });
    const { user } = renderApp(PAGE);

    await user.click(await screen.findByRole('button', { name: /^Duração de cada consulta/ }));
    await user.click(screen.getByRole('option', { name: /^30 minutos/ }));
    await user.click(saveButton());

    expect(await screen.findByText('Horários salvos.')).toBeInTheDocument();
    expect(savedBody(calls)).toHaveProperty('appointmentDurationMin', null);
  });

  it('explains when the account has no doctor profile', async () => {
    serve({
      extra: { [PATH]: () => ({ status: 404, body: { code: 'NOT_FOUND', message: 'Sem perfil.' } }) },
    });
    renderApp(PAGE);

    expect(await screen.findByText(/ainda não tem perfil médico/)).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});

describe('doctor time off', { timeout: 15_000 }, () => {
  const soon = addDays(todayInSaoPaulo(), 30);

  const createRoute =
    (create: (body: unknown) => MockResponse): ApiRoute =>
    (method, body) =>
      method === 'POST' ? create(body) : { status: 200, body: blocked };

  const openDrawer = async (user: ReturnType<typeof renderApp>['user']) => {
    await user.click((await timeOffCard()).getByRole('button', { name: 'Bloquear uma data' }));
    return within(await screen.findByRole('dialog', { name: 'Bloquear uma data' }));
  };

  it('lists the blocked days with their reasons', async () => {
    serve({ timeOff: () => ({ status: 200, body: blocked }) });
    renderApp(PAGE);
    const card = await timeOffCard();

    const rows = within(await card.findByRole('list', { name: 'Datas bloqueadas' })).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Véspera de Natal');
    expect(rows[0]).toHaveTextContent('Quinta, 24 de dezembro');
    expect(rows[1]).toHaveTextContent('Dia bloqueado');
    expect(
      within(rows[1] as HTMLElement).getByRole('button', {
        name: 'Remover bloqueio de Sexta, 25 de dezembro',
      }),
    ).toBeInTheDocument();
  });

  it('says when no day is blocked', async () => {
    serve();
    renderApp(PAGE);

    expect(await (await timeOffCard()).findByText('Nenhuma data bloqueada.')).toBeInTheDocument();
  });

  it('blocks a day with a trimmed reason and keeps the hours form untouched', async () => {
    const { calls } = serve({
      timeOff: createRoute((body) => ({ status: 201, body: { ...(body as object), warnings: [] } })),
    });
    const { user } = renderApp(PAGE);
    const drawer = await openDrawer(user);

    await user.type(drawer.getByLabelText('Data'), soon);
    await user.type(drawer.getByLabelText(/^Motivo/), '  Congresso  ');
    await user.click(drawer.getByRole('button', { name: 'Bloquear data' }));

    expect(await screen.findByText('Data bloqueada.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ date: soon, reason: 'Congresso' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      calls.filter((call) => call.method === 'GET' && call.url.pathname === TIME_OFF).length,
    ).toBeGreaterThan(1);
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument();
  });

  it('omits an empty reason and warns about the appointments already booked that day', async () => {
    const { calls } = serve({
      timeOff: createRoute((body) => ({
        status: 201,
        body: {
          ...(body as object),
          reason: null,
          warnings: [
            { appointmentId: 'a1', startsAt: `${soon}T12:00:00.000Z` },
            { appointmentId: 'a2', startsAt: `${soon}T13:30:00.000Z` },
          ],
        },
      })),
    });
    const { user } = renderApp(PAGE);
    const drawer = await openDrawer(user);

    await user.type(drawer.getByLabelText('Data'), soon);
    await user.type(drawer.getByLabelText(/^Motivo/), '   ');
    await user.click(drawer.getByRole('button', { name: 'Bloquear data' }));

    expect(await screen.findByText('Data bloqueada.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ date: soon });
    const [year, month, date] = soon.split('-');
    expect(
      await (
        await timeOffCard()
      ).findByText(
        `2 consultas já estavam marcadas nesta data: ${date}/${month}/${year}, 09:00; ${date}/${month}/${year}, 10:30. Nada foi cancelado; confira cada uma na sua agenda.`,
      ),
    ).toHaveAttribute('role', 'alert');
  });

  it.each([
    [422, 'PAST_DATE', 'Escolha hoje ou uma data futura.'],
    [422, 'DATE_TOO_FAR', 'Escolha uma data em até 365 dias.'],
    [409, 'TIME_OFF_EXISTS', 'Esta data já está bloqueada.'],
  ])('shows the %i %s error on the date field', async (status, code, message) => {
    serve({ timeOff: createRoute(() => ({ status, body: { code, message, fields: { date: message } } })) });
    const { user } = renderApp(PAGE);
    const drawer = await openDrawer(user);

    await user.type(drawer.getByLabelText('Data'), soon);
    await user.click(drawer.getByRole('button', { name: 'Bloquear data' }));

    expect(await drawer.findByText(message)).toBeInTheDocument();
    expect(drawer.getByLabelText('Data')).toHaveAttribute('aria-invalid', 'true');
    expect(drawer.getByLabelText('Data')).toHaveFocus();
  });

  it('asks for the date before sending', async () => {
    const { calls } = serve();
    const { user } = renderApp(PAGE);
    const drawer = await openDrawer(user);

    await user.click(drawer.getByRole('button', { name: 'Bloquear data' }));

    expect(await drawer.findByText('Escolha a data.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('removes a block right away', async () => {
    let list = blocked;
    const { calls } = serve({
      timeOff: () => ({ status: 200, body: list }),
      extra: {
        [`${TIME_OFF}/2026-12-24`]: (method) => {
          if (method !== 'DELETE') return undefined;
          list = blocked.slice(1);
          return { status: 204 };
        },
      },
    });
    const { user } = renderApp(PAGE);
    const card = await timeOffCard();

    await user.click(await card.findByRole('button', { name: 'Remover bloqueio de Véspera de Natal' }));

    expect(await screen.findByText('Bloqueio removido.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(card.queryByText('Véspera de Natal')).not.toBeInTheDocument();
    expect(card.getByRole('button', { name: 'Bloquear uma data' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument();
  });
});
