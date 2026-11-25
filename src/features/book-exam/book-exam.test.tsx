import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayInSaoPaulo } from '@lib/date';
import {
  calendar,
  dropdown,
  examSlot,
  openDays,
  pick,
  pickDay,
  pickedDay,
  pickTime,
  slotGroup,
  slotTimes,
} from '@/test/booking-flow';
import { apiError, renderApp, serveApi, type ApiRoute, type MockResponse } from '@/test/render-app';

const examTypes = [
  {
    id: 'e1',
    code: 'hemograma',
    name: 'Hemograma',
    kind: 'lab',
    durationMin: 10,
    preparationNotes: 'Jejum de 8 horas.',
    isActive: true,
  },
  {
    id: 'e2',
    code: 'raio_x',
    name: 'Raio-X',
    kind: 'imaging',
    durationMin: 15,
    preparationNotes: null,
    isActive: true,
  },
];

const unit = (id: string, name: string, address: string) => ({
  id,
  name,
  address,
  phone: '+551133334444',
  isActive: true,
  hours: [],
});

const units = [
  unit('u1', 'Unidade Central', 'Rua das Flores, 123'),
  unit('u2', 'Unidade Sul', 'Av. Ipiranga, 987'),
];

const days = [
  {
    date: '2026-11-23',
    slots: [
      examSlot('2026-11-23T11:00:00.000Z', 2),
      examSlot('2026-11-23T11:10:00.000Z', 1),
      examSlot('2026-11-23T20:00:00.000Z', 5),
    ],
  },
];

const examBooking = {
  id: 'x1',
  status: 'confirmed',
  publicCode: 'EX-7F3K2Q',
  startsAt: '2026-11-23T11:00:00.000Z',
  endsAt: '2026-11-23T11:10:00.000Z',
  notes: null,
  examType: { id: 'e1', name: 'Hemograma', kind: 'lab', preparationNotes: 'Jejum de 8 horas.' },
  unit: { id: 'u2', name: 'Unidade Sul', address: 'Av. Ipiranga, 987', phone: '+551133334444' },
  cancellation: null,
  createdAt: '2026-11-14T12:00:00.000Z',
  events: [],
};

function serve(
  book: () => MockResponse = () => ({ status: 201, body: examBooking }),
  loadsServed = [days, days],
  overrides: Record<string, ApiRoute> = {},
) {
  let loads = 0;
  const served = serveApi(['patient'], {
    '/api/exam-types': () => ({ status: 200, body: examTypes }),
    '/api/units': (_method, _body, url) => ({
      status: 200,
      body: url.searchParams.get('examTypeId') === 'e1' ? units : [units[0]],
    }),
    '/api/exam-availability': (_method, _body, url) => {
      if (url.searchParams.get('from') !== todayInSaoPaulo()) return { status: 200, body: { days: [] } };
      const response = loadsServed[Math.min(loads, loadsServed.length - 1)];
      loads += 1;
      return { status: 200, body: { days: response } };
    },
    '/api/exam-bookings': book,
    ...overrides,
  });
  return { ...served, availabilityLoads: () => loads };
}

const MONDAY = 'Segunda, 23 de novembro';

const notes = () => screen.getByRole('textbox', { name: 'Observação' });

const openOptions = async (user: User, label: string) => {
  await user.click(dropdown(label));
  const list = await screen.findByRole('listbox', { name: label });
  return within(list)
    .getAllByRole('option')
    .map((option) => option.querySelector('span span')?.textContent);
};

const chooseOption = (user: User, name: string) =>
  user.click(screen.getByRole('option', { name: new RegExp(`^${name}`) }));

async function start() {
  const view = renderApp('/paciente/exames/novo');
  await waitFor(() => expect(dropdown('Exame')).toBeEnabled());
  return view;
}

type User = Awaited<ReturnType<typeof start>>['user'];

async function fill(user: User) {
  await pick(user, 'Exame', 'Hemograma');
  await waitFor(() => expect(dropdown('Unidade')).toBeEnabled());
  await pick(user, 'Unidade', 'Unidade Sul');
  await pickDay(user, MONDAY);
  await pickTime(user, '08:00');
}

const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Agendar' }));

const unitCalls = (calls: ReturnType<typeof serve>['calls']) =>
  calls.filter((call) => call.url.pathname === '/api/units').length;

afterEach(() => {
  vi.useRealTimers();
});

describe('book exam', { timeout: 20_000 }, () => {
  it('lists the units of the chosen exam and shows the free days after both', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(dropdown('Unidade')).toBeDisabled();
    expect(screen.queryByRole('heading', { name: 'Data e horário' })).not.toBeInTheDocument();

    await pick(user, 'Exame', 'Raio-X');
    await waitFor(() => expect(dropdown('Unidade')).toBeEnabled());
    expect(await openOptions(user, 'Unidade')).toEqual(['Unidade Central']);
    await chooseOption(user, 'Unidade Central');

    await pick(user, 'Exame', 'Hemograma');
    await waitFor(() => expect(dropdown('Unidade')).toBeEnabled());
    expect(await openOptions(user, 'Unidade')).toEqual(['Unidade Central', 'Unidade Sul']);
    await chooseOption(user, 'Unidade Sul');

    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    await pickDay(user, MONDAY);
    expect(slotTimes()).toEqual(['08:00, 2 vagas', '08:10, 1 vaga']);
    await user.click(
      within(screen.getByRole('group', { name: 'Período' })).getByRole('button', { name: /^Tarde/ }),
    );
    expect(slotTimes()).toEqual(['17:00']);
    const availability = calls.filter((call) => call.url.pathname === '/api/exam-availability');
    expect(availability.at(-1)?.url.searchParams.get('unitId')).toBe('u2');
    expect(availability.at(-1)?.url.searchParams.get('examTypeId')).toBe('e1');
  });

  it('shows the first free month again when going back to a unit already loaded', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    serve();
    const { user } = await start();
    await pick(user, 'Exame', 'Hemograma');
    await waitFor(() => expect(dropdown('Unidade')).toBeEnabled());
    await pick(user, 'Unidade', 'Unidade Central');
    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    await pick(user, 'Unidade', 'Unidade Sul');
    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    for (let step = 0; step < 3; step += 1) {
      await user.click(within(calendar()).getByRole('button', { name: 'Próximo mês' }));
    }
    expect(within(calendar()).getByText(/fevereiro/i)).toBeVisible();

    await pick(user, 'Unidade', 'Unidade Central');

    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    expect(within(calendar()).getByText(/novembro/i)).toBeVisible();
  });

  it('shows the preparation of each exam and the address of each unit', async () => {
    serve();
    const { user } = await start();

    await user.click(dropdown('Exame'));
    expect(await screen.findByRole('option', { name: /Raio-X\s*Sem preparo especial/ })).toBeVisible();
    await user.click(screen.getByRole('option', { name: /^Hemograma/ }));
    expect(screen.getByRole('note')).toHaveTextContent('Preparo: Jejum de 8 horas.');
    await waitFor(() => expect(dropdown('Unidade')).toBeEnabled());
    await user.click(dropdown('Unidade'));
    expect(await screen.findByRole('option', { name: /Unidade Sul\s*Av\. Ipiranga, 987/ })).toBeVisible();
  });

  it('clears the unit, day and time when the exam changes', async () => {
    serve();
    const { user } = await start();
    await fill(user);

    await pick(user, 'Exame', 'Raio-X');

    expect(dropdown('Unidade')).toHaveTextContent('Escolha o local');
    expect(screen.queryByRole('group', { name: 'Calendário' })).not.toBeInTheDocument();
    expect(screen.getByText('Escolha dia e horário')).toBeVisible();
  });

  it('shows the availability error and reloads the units when the offer is gone', async () => {
    const { calls } = serve(undefined, undefined, {
      '/api/exam-availability': () => apiError(404, 'NOT_FOUND'),
    });
    const { user } = await start();
    await pick(user, 'Exame', 'Hemograma');
    await waitFor(() => expect(dropdown('Unidade')).toBeEnabled());
    const before = unitCalls(calls);

    await pick(user, 'Unidade', 'Unidade Sul');

    expect(
      await screen.findByText('Este exame não está mais disponível neste local. Escolha outro.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    await waitFor(() => expect(unitCalls(calls)).toBeGreaterThan(before));
    expect(screen.queryByRole('group', { name: 'Calendário' })).not.toBeInTheDocument();
  });

  it('reloads the units and clears the chosen one when it no longer offers the exam', async () => {
    let offered = units;
    const { calls } = serve(
      () => {
        offered = units.slice(0, 1);
        return apiError(404, 'NOT_FOUND');
      },
      undefined,
      { '/api/units': () => ({ status: 200, body: offered }) },
    );
    const { user } = await start();
    await fill(user);
    const before = unitCalls(calls);

    await submit(user);

    expect(
      await screen.findByText('Este exame não está mais disponível neste local. Escolha outro.'),
    ).toHaveAttribute('role', 'alert');
    await waitFor(() => expect(unitCalls(calls)).toBeGreaterThan(before));
    await waitFor(() =>
      expect(dropdown('Unidade')).toHaveAccessibleDescription(
        'Este local não faz mais este exame. Escolha outro.',
      ),
    );
    expect(dropdown('Unidade')).toHaveTextContent('Escolha o local');
    expect(screen.queryByRole('group', { name: 'Calendário' })).not.toBeInTheDocument();
  });

  it('books the exam, shows the public code and opens the booking', async () => {
    const { calls } = serve();
    const { user, router } = await start();
    await fill(user);
    await user.type(notes(), ' Levo o pedido. ');

    await submit(user);

    expect(await screen.findByText('Exame agendado. Apresente o código EX-7F3K2Q na unidade.')).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(router.state.location.search).toBe('?id=x1');
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      examTypeId: 'e1',
      unitId: 'u2',
      startsAt: '2026-11-23T11:00:00.000Z',
      notes: 'Levo o pedido.',
    });
  });

  it('moves and checks the time with the arrow keys from a single tab stop', async () => {
    serve();
    const { user } = await start();
    await fill(user);
    const first = within(slotGroup()).getByRole('radio', { name: /^08:00/ });
    const second = within(slotGroup()).getByRole('radio', { name: /^08:10/ });
    expect([first.tabIndex, second.tabIndex]).toEqual([0, -1]);

    await user.keyboard('{ArrowRight}');

    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-checked', 'true');
    expect(second.tabIndex).toBe(0);
  });

  it('sums up the choices in the action bar', async () => {
    serve();
    const { user } = await start();

    await fill(user);

    expect(screen.getByText('Seg, 23/11 às 08:00')).toBeVisible();
    expect(screen.getByText('Hemograma · Unidade Sul')).toBeVisible();
  });

  it('reloads the free slots and keeps the form when the last place was taken', async () => {
    const remaining = [{ date: '2026-11-23', slots: [examSlot('2026-11-23T20:00:00.000Z', 5)] }];
    const { availabilityLoads } = serve(
      () => apiError(409, 'NO_CAPACITY', { startsAt: 'API' }),
      [days, remaining],
    );
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Não há mais vagas neste horário. Escolha outro.');
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    await waitFor(() => expect(slotTimes()).toEqual(['17:00']));
    expect(availabilityLoads()).toBe(2);
    expect(dropdown('Exame')).toHaveTextContent('Hemograma');
    expect(dropdown('Unidade')).toHaveTextContent('Unidade Sul');
    expect(pickedDay()).toBe(MONDAY);
  });

  it('puts the API field errors on their fields', async () => {
    serve(() => apiError(400, 'VALIDATION_ERROR', { notes: 'Use até 500 caracteres.' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Use até 500 caracteres.');
    expect(notes()).toHaveAttribute('aria-describedby', message.id);
    expect(notes()).toHaveFocus();
  });

  it('warns when the patient reached the limit of active bookings', async () => {
    serve(() => apiError(422, 'ACTIVE_LIMIT', { _root: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    expect(await screen.findByText(/limite de agendamentos ativos/)).toHaveAttribute('role', 'alert');
    expect(within(slotGroup()).getByRole('radio', { name: /^08:00/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('asks for every field before sending', async () => {
    const { calls } = serve();
    const { user } = await start();

    await submit(user);

    expect(await screen.findByText('Preencha todas as informações.')).toHaveAttribute('role', 'alert');
    expect(dropdown('Exame')).toHaveAccessibleDescription('Escolha o tipo de exame.');
    expect(dropdown('Unidade')).toHaveAccessibleDescription('Escolha o local do exame.');
    expect(dropdown('Exame')).toHaveFocus();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });
});
