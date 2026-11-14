import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayInSaoPaulo } from '@lib/date';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';

const specialties = [
  { id: 's1', name: 'Cardiologia', council: 'CRM', appointmentDurationMin: 30, isActive: true },
  { id: 's2', name: 'Nutrição', council: 'CRN', appointmentDurationMin: 30, isActive: true },
];

const unit = { id: 'u1', name: 'Unidade Central', address: 'Rua das Flores, 123', phone: '+551133334444' };

const doctors = [
  {
    id: 'd1',
    fullName: 'Carlos Mendes',
    specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
    unit,
    registry: { number: '123456', uf: 'SP' },
  },
  {
    id: 'd2',
    fullName: 'Beatriz Lima',
    specialty: { id: 's2', name: 'Nutrição', council: 'CRN' },
    unit,
    registry: { number: '654321', uf: 'SP' },
  },
];

const slot = (startsAt: string) => ({ startsAt, endsAt: startsAt });

const days = [
  {
    date: '2026-11-23',
    slots: [slot('2026-11-23T11:00:00.000Z'), slot('2026-11-23T17:30:00.000Z')],
  },
  { date: '2026-11-24', slots: [slot('2026-11-24T12:00:00.000Z')] },
];

const appointment = {
  id: 'a1',
  status: 'pending',
  visitType: 'routine',
  startsAt: '2026-11-23T17:30:00.000Z',
  endsAt: '2026-11-23T18:00:00.000Z',
  notes: null,
  patient: { id: 'p1', fullName: 'Ana Maria Silva' },
  doctor: { id: 'd1', fullName: 'Carlos Mendes' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  unit,
  createdAt: '2026-11-14T12:00:00.000Z',
  events: [],
};

const apiError = (status: number, code: string, fields: Record<string, string> = {}) => ({
  status,
  body: { code, message: `API: ${code}`, fields },
});

type Day = (typeof days)[number];

interface Schedule {
  first?: Day[][];
  second?: Day[];
}

function serve(
  book: () => MockResponse = () => ({ status: 201, body: appointment }),
  { first = [days], second = [] }: Schedule = {},
) {
  let loads = 0;
  const served = serveApi(['patient'], {
    '/api/specialties': () => ({ status: 200, body: specialties }),
    '/api/doctors': (_method, _body, url) => {
      const specialtyId = url.searchParams.get('specialtyId');
      const items = doctors.filter((item) => !specialtyId || item.specialty.id === specialtyId);
      return { status: 200, body: { items, page: 1, pageSize: 50, total: items.length } };
    },
    '/api/doctors/d1/availability': (_method, _body, url) => {
      if (url.searchParams.get('from') !== todayInSaoPaulo()) return { status: 200, body: { days: second } };
      const response = first[Math.min(loads, first.length - 1)] ?? [];
      loads += 1;
      return { status: 200, body: { days: response } };
    },
    '/api/appointments': book,
  });
  return { ...served, availabilityLoads: () => loads };
}

const field = (name: string) => screen.getByRole('combobox', { name });

const notes = () => screen.getByRole('textbox', { name: 'Observações (opcional)' });

const optionsOf = (name: string) =>
  within(field(name))
    .getAllByRole('option')
    .filter((option) => !(option as HTMLOptionElement).disabled)
    .map((option) => option.textContent);

async function start() {
  const view = renderApp('/paciente/consultas/nova');
  await screen.findByRole('option', { name: 'Carlos Mendes' });
  await screen.findByRole('option', { name: 'Cardiologia' });
  return view;
}

async function fill(user: Awaited<ReturnType<typeof start>>['user']) {
  await user.selectOptions(field('Médico'), 'Carlos Mendes');
  await user.selectOptions(field('Tipo de consulta'), 'Rotina');
  await user.selectOptions(await screen.findByRole('combobox', { name: 'Data' }), 'seg., 23/11');
  await user.selectOptions(field('Horário'), '14:30');
}

const submitButton = () => screen.getByRole('button', { name: 'Agendar Consulta' });

const submit = (user: Awaited<ReturnType<typeof start>>['user']) => user.click(submitButton());

const windowsOf = (calls: ReturnType<typeof serve>['calls']) =>
  calls
    .filter((call) => call.url.pathname.endsWith('/availability'))
    .map((call) => ({ from: call.url.searchParams.get('from'), to: call.url.searchParams.get('to') }));

afterEach(() => {
  vi.useRealTimers();
});

describe('book appointment', { timeout: 15_000 }, () => {
  it('fills the specialty from the doctor and narrows the doctors by specialty', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(optionsOf('Médico')).toEqual(['Carlos Mendes', 'Beatriz Lima']);

    await user.selectOptions(field('Médico'), 'Beatriz Lima');
    expect(field('Especialidade')).toHaveValue('s2');
    expect(field('Médico')).toHaveAccessibleDescription('Unidade Central · Rua das Flores, 123');

    await user.selectOptions(field('Especialidade'), 'Cardiologia');
    expect(field('Médico')).toHaveValue('');
    await waitFor(() => expect(optionsOf('Médico')).toEqual(['Carlos Mendes']));
    expect(calls.some((call) => call.url.searchParams.get('specialtyId') === 's1')).toBe(true);
  });

  it('offers only the days and times with free slots, shown in São Paulo time', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(field('Data')).toBeDisabled();

    await user.selectOptions(field('Médico'), 'Carlos Mendes');

    await waitFor(() => expect(optionsOf('Data')).toEqual(['seg., 23/11', 'ter., 24/11']));
    expect(field('Horário')).toBeDisabled();
    expect(windowsOf(calls)).toHaveLength(2);

    await user.selectOptions(field('Data'), 'seg., 23/11');
    expect(optionsOf('Horário')).toEqual(['08:00', '14:30']);
    await user.selectOptions(field('Data'), 'ter., 24/11');
    expect(field('Horário')).toHaveValue('');
    expect(optionsOf('Horário')).toEqual(['09:00']);
  });

  it('asks for two 31-day windows from today in São Paulo and merges their days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-20T02:30:00.000Z'));
    const { calls } = serve(undefined, { first: [[days[0] as Day]], second: [days[1] as Day] });
    const { user } = await start();

    await user.selectOptions(field('Médico'), 'Carlos Mendes');

    await waitFor(() => expect(optionsOf('Data')).toEqual(['seg., 23/11', 'ter., 24/11']));
    expect(windowsOf(calls)).toEqual([
      { from: '2026-11-19', to: '2026-12-19' },
      { from: '2026-12-20', to: '2027-01-19' },
    ]);
  });

  it('warns when the doctor has no free slot', async () => {
    serve(undefined, { first: [[]] });
    const { user } = await start();

    await user.selectOptions(field('Médico'), 'Carlos Mendes');

    expect(await screen.findByRole('note')).toHaveTextContent(/não tem vagas livres/);
    expect(field('Data')).toBeDisabled();
  });

  it('clears a picked day that is no longer free and points at it', async () => {
    serve(undefined, { first: [days, [days[1] as Day]] });
    const { user, queryClient } = await start();
    await fill(user);

    await queryClient.invalidateQueries({ queryKey: ['booking', 'availability'] });

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(field('Data')).toHaveValue('');
    expect(field('Data')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Data')).toHaveFocus();
    expect(field('Horário')).toBeDisabled();
  });

  it('clears a picked time that is no longer free and points at it', async () => {
    const morning = { date: '2026-11-23', slots: [slot('2026-11-23T11:00:00.000Z')] };
    serve(undefined, { first: [days, [morning]] });
    const { user, queryClient } = await start();
    await fill(user);

    await queryClient.invalidateQueries({ queryKey: ['booking', 'availability'] });

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(field('Data')).toHaveValue('2026-11-23');
    expect(field('Horário')).toHaveValue('');
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveFocus();
  });

  it('sends the slot received and shows the request as sent', async () => {
    const { calls } = serve();
    const { user } = await start();
    await fill(user);
    await user.type(notes(), '  Tenho alergia a dipirona. ');

    await submit(user);

    const dialog = await screen.findByRole('dialog', { name: 'Pedido enviado, aguardando confirmação' });
    expect(dialog).toHaveAccessibleDescription(
      'Consulta de Cardiologia com Carlos Mendes em 23/11/2026, 14:30. Avisaremos quando o médico confirmar.',
    );
    const details = within(dialog).getByRole('link', { name: 'Ver detalhes' });
    expect(details).toHaveAttribute('href', '/paciente/agendamentos');
    expect(details).toHaveFocus();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      doctorId: 'd1',
      specialtyId: 's1',
      visitType: 'routine',
      startsAt: '2026-11-23T17:30:00.000Z',
      notes: 'Tenho alergia a dipirona.',
    });
    expect(field('Médico')).toHaveValue('');

    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    expect(dialog).not.toHaveAttribute('open');
    expect(submitButton()).toHaveFocus();
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
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveValue('');
    await waitFor(() => expect(optionsOf('Horário')).toEqual(['08:00']));
    expect(availabilityLoads()).toBe(2);
    expect(field('Médico')).toHaveValue('d1');
    expect(field('Especialidade')).toHaveValue('s1');
    expect(field('Tipo de consulta')).toHaveValue('routine');
    expect(field('Data')).toHaveValue('2026-11-23');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
    expect(field('Especialidade')).toHaveAttribute('aria-describedby', message.id);
  });

  it('explains a conflict with another booking of the patient on the time field', async () => {
    serve(() => apiError(409, 'PATIENT_CONFLICT', { startsAt: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Você já tem um agendamento neste horário. Escolha outro.');
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveFocus();
  });

  it('explains a booking with the patient as the doctor on the doctor field', async () => {
    serve(() => apiError(422, 'SELF_BOOKING', { doctorId: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Não é possível agendar uma consulta com você mesmo.');
    expect(field('Médico').getAttribute('aria-describedby')).toContain(message.id);
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
    expect(field('Horário')).toHaveValue('2026-11-23T17:30:00.000Z');
  });

  it('asks for every field before sending', async () => {
    const { calls } = serve();
    const { user } = await start();

    await submit(user);

    expect(await screen.findByText('Preencha todas as informações.')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Escolha o médico.')).toBeInTheDocument();
    expect(screen.getByText('Escolha o horário.')).toBeInTheDocument();
    expect(field('Médico')).toHaveFocus();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });
});
