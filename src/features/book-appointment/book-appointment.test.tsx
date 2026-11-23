import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, todayInSaoPaulo } from '@lib/date';
import {
  dropdown,
  calendar,
  openDays,
  pick,
  pickDay,
  pickedDay,
  pickTime,
  slot,
  slotGroup,
  slotTimes,
} from '@/test/booking-flow';
import { patientAppointment, unit } from '@/test/patient-fixtures';
import { apiError, holdRequests, renderApp, serveApi, type MockResponse } from '@/test/render-app';

const specialties = [
  { id: 's1', name: 'Cardiologia', council: 'CRM', appointmentDurationMin: 30, isActive: true },
  { id: 's2', name: 'Nutrição', council: 'CRN', appointmentDurationMin: 30, isActive: true },
];

const doctors = [
  {
    id: 'd1',
    fullName: 'Carlos Mendes',
    specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
    unit: unit(),
    registry: { number: '123456', uf: 'SP' },
  },
  {
    id: 'd2',
    fullName: 'Beatriz Lima',
    specialty: { id: 's2', name: 'Nutrição', council: 'CRN' },
    unit: unit(),
    registry: { number: '654321', uf: 'SP' },
  },
];

const days = [
  {
    date: '2026-11-23',
    slots: [slot('2026-11-23T11:00:00.000Z'), slot('2026-11-23T17:30:00.000Z')],
  },
  { date: '2026-11-24', slots: [slot('2026-11-24T12:00:00.000Z')] },
];

const appointment = patientAppointment();

type Day = (typeof days)[number];

interface Schedule {
  first?: Day[][];
  second?: Day[];
  later?: Record<string, Day[]>;
  failing?: Record<string, MockResponse>;
}

function serve(
  book: () => MockResponse = () => ({ status: 201, body: appointment }),
  { first = [days], second = [], later = {}, failing = {} }: Schedule = {},
) {
  let loads = 0;
  const served = serveApi(['patient'], {
    '/api/specialties': () => ({ status: 200, body: specialties }),
    '/api/doctors': (_method, _body, url) => {
      const specialtyId = url.searchParams.get('specialtyId');
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';
      const items = doctors.filter(
        (item) =>
          (!specialtyId || item.specialty.id === specialtyId) && item.fullName.toLowerCase().includes(search),
      );
      return { status: 200, body: { items, page: 1, pageSize: 50, total: items.length } };
    },
    '/api/doctors/d1/availability': (_method, _body, url) => {
      const from = url.searchParams.get('from') ?? '';
      if (from === addDays(todayInSaoPaulo(), 31)) return { status: 200, body: { days: second } };
      if (from in failing) return failing[from];
      if (from !== todayInSaoPaulo()) return { status: 200, body: { days: later[from] ?? [] } };
      const response = first[Math.min(loads, first.length - 1)] ?? [];
      loads += 1;
      return { status: 200, body: { days: response } };
    },
    '/api/appointments': book,
  });
  return { ...served, availabilityLoads: () => loads };
}

type User = ReturnType<typeof renderApp>['user'];

const MONDAY = 'Segunda, 23 de novembro';
const TUESDAY = 'Terça, 24 de novembro';

const notes = () => screen.getByRole('textbox', { name: 'Observação' });
const doctorList = () => screen.getByRole('radiogroup', { name: 'Médico' });
const doctorNames = () =>
  within(doctorList())
    .getAllByRole('radio')
    .map((radio) => radio.querySelector('span span')?.textContent);

async function start() {
  const view = renderApp('/paciente/consultas/nova');
  await screen.findByRole('radio', { name: /Carlos Mendes/ }, { timeout: 10_000 });
  await waitFor(() => expect(dropdown('Especialidade')).toBeEnabled());
  return view;
}

async function fill(user: User) {
  await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));
  await pick(user, 'Tipo de consulta', 'Rotina');
  await pickDay(user, MONDAY);
  await pickTime(user, '14:30');
}

const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Agendar' }));

const windowsOf = (calls: ReturnType<typeof serve>['calls']) =>
  calls
    .filter((call) => call.url.pathname.endsWith('/availability'))
    .map((call) => ({ from: call.url.searchParams.get('from'), to: call.url.searchParams.get('to') }));

afterEach(() => {
  vi.useRealTimers();
});

describe('book appointment', { timeout: 20_000 }, () => {
  it('fills the specialty from the doctor and narrows the doctors by specialty', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(doctorNames()).toEqual(['Carlos Mendes', 'Beatriz Lima']);

    await user.click(screen.getByRole('radio', { name: /Beatriz Lima/ }));
    expect(dropdown('Especialidade')).toHaveTextContent('Nutrição');
    expect(screen.getByRole('radio', { name: /Beatriz Lima/ })).toHaveAttribute('aria-checked', 'true');

    await pick(user, 'Especialidade', 'Cardiologia');
    await waitFor(() => expect(doctorNames()).toEqual(['Carlos Mendes']));
    expect(screen.getByRole('radio', { name: /Carlos Mendes/ })).toHaveAttribute('aria-checked', 'false');
    expect(calls.some((call) => call.url.searchParams.get('specialtyId') === 's1')).toBe(true);
  });

  it('shows the duration of each specialty and the meaning of each visit type', async () => {
    serve();
    const { user } = await start();

    await user.click(dropdown('Especialidade'));
    expect(
      await screen.findByRole('option', { name: /Cardiologia\s*Consultas de 30 minutos/ }),
    ).toBeVisible();
    await user.keyboard('{Escape}');
    await user.click(dropdown('Tipo de consulta'));
    expect(
      await screen.findByRole('option', { name: /Retorno\s*Volta depois de uma consulta recente/ }),
    ).toBeVisible();
  });

  it('shows the total of doctors and how to find the ones beyond the first page', async () => {
    serveApi(['patient'], {
      '/api/specialties': () => ({ status: 200, body: specialties }),
      '/api/doctors': () => ({ status: 200, body: { items: doctors, page: 1, pageSize: 50, total: 120 } }),
    });
    const { user } = await start();

    expect(screen.getByText('120 disponíveis')).toBeVisible();
    const hint = screen.getByText('Mostrando 2 de 120. Busque pelo nome para encontrar os demais.');
    expect(hint).toBeVisible();
    expect(doctorList()).not.toContainElement(hint);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar médico' }), 'a');

    expect(
      await screen.findByText('Mostrando 2 de 120. Refine a busca para encontrar outros médicos.'),
    ).toBeVisible();
  });

  it('searches the doctors by name in the API', async () => {
    const { calls } = serve();
    const { user } = await start();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar médico' }), 'bea');

    await waitFor(() => expect(doctorNames()).toEqual(['Beatriz Lima']));
    expect(calls.some((call) => call.url.searchParams.get('search') === 'bea')).toBe(true);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar médico' }), 'xyz');
    expect(await screen.findByText('Nenhum médico encontrado para "beaxyz".')).toBeVisible();
  });

  it('offers only the days and times with free slots, shown in São Paulo time', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(screen.getByText('Escolha o médico para ver os dias e horários livres.')).toBeVisible();

    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));

    await waitFor(() => expect(openDays()).toEqual([MONDAY, TUESDAY]));
    expect(windowsOf(calls)).toHaveLength(2);
    await pickDay(user, MONDAY);
    expect(screen.getByText('2 horários livres')).toBeVisible();
    expect(slotTimes()).toEqual(['08:00']);
    await user.click(
      within(screen.getByRole('group', { name: 'Período' })).getByRole('button', { name: /^Tarde/ }),
    );
    expect(slotTimes()).toEqual(['14:30']);
    await pickDay(user, TUESDAY);
    expect(slotTimes()).toEqual(['09:00']);
  });

  it('asks for two 31-day windows from today in São Paulo and merges their days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    const { calls } = serve(undefined, { first: [[days[0] as Day]], second: [days[1] as Day] });
    const { user } = await start();

    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));

    await waitFor(() => expect(openDays()).toEqual([MONDAY, TUESDAY]));
    expect(windowsOf(calls)).toEqual([
      { from: '2026-11-19', to: '2026-12-19' },
      { from: '2026-12-20', to: '2027-01-19' },
    ]);
  });

  it('loads later months on demand as the calendar moves, past a month without free slots', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    const farDay = { date: '2027-03-01', slots: [slot('2027-03-01T11:00:00.000Z')] };
    const { calls } = serve(undefined, {
      first: [[days[0] as Day]],
      second: [],
      later: { '2027-01-20': [], '2027-02-20': [farDay] },
    });
    const { user } = await start();

    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));
    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    expect(windowsOf(calls)).toHaveLength(2);

    for (let step = 0; step < 4; step += 1) {
      await user.click(within(calendar()).getByRole('button', { name: 'Próximo mês' }));
    }

    await waitFor(() => expect(openDays()).toEqual(['Segunda, 1 de março']));
    expect(windowsOf(calls).slice(2)).toEqual([
      { from: '2027-01-20', to: '2027-02-19' },
      { from: '2027-02-20', to: '2027-03-22' },
      { from: '2027-03-23', to: '2027-04-22' },
    ]);
  });

  it('tells a later month is still loading its free slots', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    const { fetchMock } = serve(undefined, { first: [[days[0] as Day]] });
    const { user } = await start();
    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));
    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    const held = holdRequests(fetchMock, () => true);
    const status = within(calendar()).getByRole('status');
    const grid = () => within(calendar()).getByRole('button', { name: /, 1 de janeiro/ }).parentElement;
    expect(status).toBeEmptyDOMElement();

    await user.click(within(calendar()).getByRole('button', { name: 'Próximo mês' }));
    await user.click(within(calendar()).getByRole('button', { name: 'Próximo mês' }));

    await waitFor(() => expect(status).toHaveTextContent('Carregando horários…'));
    expect(grid()).toHaveAttribute('aria-busy', 'true');
    held.forEach((request) => request.release());
    await waitFor(() => expect(status).toBeEmptyDOMElement());
    expect(grid()).not.toHaveAttribute('aria-busy');
  });

  it('stops asking for a later window that fails and starts over on retry', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    const { calls } = serve(undefined, {
      first: [[days[0] as Day]],
      failing: { '2027-01-20': apiError(429, 'RATE_LIMITED') },
    });
    const { user } = await start();
    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));
    await waitFor(() => expect(openDays()).toEqual([MONDAY]));

    await user.click(within(calendar()).getByRole('button', { name: 'Próximo mês' }));
    await user.click(within(calendar()).getByRole('button', { name: 'Próximo mês' }));

    const retry = await screen.findByRole('button', { name: 'Tentar de novo' });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const failed = () => windowsOf(calls).filter((window) => window.from === '2027-01-20');
    expect(failed()).toHaveLength(1);

    await user.click(retry);

    await waitFor(() => expect(openDays()).toEqual([MONDAY]));
    expect(failed()).toHaveLength(1);
  });

  it('warns when the doctor has no free slot in the whole horizon', async () => {
    const { calls } = serve(undefined, { first: [[]] });
    const { user } = await start();

    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));

    expect(await screen.findByRole('note')).toHaveTextContent(/não tem vagas livres/);
    expect(screen.queryByRole('group', { name: 'Calendário' })).not.toBeInTheDocument();
    expect(windowsOf(calls)).toHaveLength(12);
    expect(windowsOf(calls).at(-1)?.to).toBe(addDays(todayInSaoPaulo(), 365));
  });

  it('looks for later windows when the first ones have no free slot', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    const farDay = { date: '2027-03-01', slots: [slot('2027-03-01T11:00:00.000Z')] };
    const { calls } = serve(undefined, { first: [[]], later: { '2027-02-20': [farDay] } });
    const { user } = await start();

    await user.click(screen.getByRole('radio', { name: /Carlos Mendes/ }));

    await waitFor(() => expect(openDays()).toEqual(['Segunda, 1 de março']));
    expect(screen.queryByText(/não tem vagas livres/)).not.toBeInTheDocument();
    expect(windowsOf(calls)).toHaveLength(4);
  });

  it('clears a picked day that is no longer free and points at it', async () => {
    serve(undefined, { first: [days, [days[1] as Day]] });
    const { user, queryClient } = await start();
    await fill(user);

    await queryClient.invalidateQueries({ queryKey: ['booking', 'availability'] });

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(pickedDay()).toBeUndefined();
    expect(calendar()).toHaveAttribute('aria-describedby', message.id);
    expect(calendar()).toHaveFocus();
  });

  it('clears a picked time that is no longer free and points at it', async () => {
    const morning = { date: '2026-11-23', slots: [slot('2026-11-23T11:00:00.000Z')] };
    serve(undefined, { first: [days, [morning]] });
    const { user, queryClient } = await start();
    await fill(user);

    await queryClient.invalidateQueries({ queryKey: ['booking', 'availability'] });

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(pickedDay()).toBe(MONDAY);
    expect(within(slotGroup()).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    expect(slotGroup()).toHaveFocus();
  });

  it('sends the slot received, shows the request as sent and opens it', async () => {
    const { calls } = serve();
    const { user, router } = await start();
    await fill(user);
    await user.type(notes(), '  Tenho alergia a dipirona. ');

    await submit(user);

    expect(await screen.findByText('Pedido enviado. Avisaremos quando o médico confirmar.')).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(router.state.location.search).toBe('?id=a1');
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      doctorId: 'd1',
      specialtyId: 's1',
      visitType: 'routine',
      startsAt: '2026-11-23T17:30:00.000Z',
      notes: 'Tenho alergia a dipirona.',
    });
  });

  it('sums up the choices in the action bar', async () => {
    serve();
    const { user } = await start();
    expect(screen.getByText('Escolha dia e horário')).toBeVisible();

    await fill(user);

    expect(screen.getByText('Seg, 23/11 às 14:30')).toBeVisible();
    expect(screen.getByText('Carlos Mendes · Rotina')).toBeVisible();
  });

  it('reloads the free slots and keeps the form when the slot was just taken', async () => {
    const remaining = [{ date: '2026-11-23', slots: [slot('2026-11-23T11:00:00.000Z')] }];
    const { availabilityLoads } = serve(() => apiError(409, 'SLOT_TAKEN', { startsAt: 'API' }), {
      first: [days, remaining],
    });
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    await waitFor(() => expect(slotTimes()).toEqual(['08:00']));
    expect(within(slotGroup()).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(availabilityLoads()).toBe(2);
    expect(screen.getByRole('radio', { name: /Carlos Mendes/ })).toHaveAttribute('aria-checked', 'true');
    expect(dropdown('Especialidade')).toHaveTextContent('Cardiologia');
    expect(dropdown('Tipo de consulta')).toHaveTextContent('Rotina');
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

  it('explains a specialty the doctor does not attend on the specialty field', async () => {
    serve(() => apiError(422, 'SPECIALTY_MISMATCH', { specialtyId: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Este médico não atende a especialidade escolhida.');
    expect(dropdown('Especialidade').getAttribute('aria-describedby')).toContain(message.id);
  });

  it('explains a conflict with another booking of the patient on the time field', async () => {
    serve(() => apiError(409, 'PATIENT_CONFLICT', { startsAt: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Você já tem um agendamento neste horário. Escolha outro.');
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    expect(slotGroup()).toHaveFocus();
  });

  it('explains a booking with the patient as the doctor on the doctor field', async () => {
    serve(() => apiError(422, 'SELF_BOOKING', { doctorId: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Não é possível agendar uma consulta com você mesmo.');
    expect(doctorList()).toHaveAttribute('aria-describedby', message.id);
  });

  it('reloads the doctors when the chosen one is gone', async () => {
    const { calls } = serve(() => apiError(404, 'NOT_FOUND'));
    const { user } = await start();
    await fill(user);
    const doctorLoads = () => calls.filter((call) => call.url.pathname === '/api/doctors').length;
    const before = doctorLoads();

    await submit(user);

    expect(await screen.findByText('Este médico não está mais disponível. Escolha outro.')).toHaveAttribute(
      'role',
      'alert',
    );
    await waitFor(() => expect(doctorLoads()).toBeGreaterThan(before));
  });

  it('warns when the patient reached the limit of active bookings', async () => {
    serve(() => apiError(422, 'ACTIVE_LIMIT', { _root: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    expect(await screen.findByText(/limite de agendamentos ativos/)).toHaveAttribute('role', 'alert');
    expect(within(slotGroup()).getByRole('radio', { name: /^14:30/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('asks for every field before sending', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(screen.getByRole('button', { name: 'Agendar' })).toHaveAttribute('aria-disabled', 'true');

    await submit(user);

    expect(await screen.findByText('Preencha todas as informações.')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Escolha o médico.')).toBeInTheDocument();
    expect(screen.getByText('Escolha o tipo de consulta.')).toBeInTheDocument();
    expect(dropdown('Especialidade')).toHaveFocus();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('keeps the form when Enter is pressed in the doctor search', async () => {
    const { calls } = serve();
    const { user } = await start();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar médico' }), 'bea{Enter}');

    await waitFor(() => expect(doctorNames()).toEqual(['Beatriz Lima']));
    expect(screen.queryByText('Preencha todas as informações.')).not.toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('names each dropdown with its chosen value', async () => {
    serve();
    const { user } = await start();

    await pick(user, 'Tipo de consulta', 'Retorno');

    expect(dropdown('Tipo de consulta')).toHaveAccessibleName('Tipo de consulta Retorno');
  });

  it('keeps a single tab stop in the doctor list that follows the chosen doctor', async () => {
    serve();
    const { user } = await start();
    const tabStops = () =>
      within(doctorList())
        .getAllByRole('radio')
        .map((radio) => radio.tabIndex);
    expect(tabStops()).toEqual([0, -1]);

    await user.click(screen.getByRole('radio', { name: /Beatriz Lima/ }));

    await waitFor(() => expect(screen.getByRole('radio', { name: /Beatriz Lima/ }).tabIndex).toBe(0));
    expect(
      within(doctorList())
        .getAllByRole('radio')
        .filter((radio) => radio.tabIndex === 0),
    ).toHaveLength(1);
  });
});
