import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayInSaoPaulo } from '@lib/date';
import { renderApp, serveApi, type ApiRoute, type MockResponse } from '@/test/render-app';

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

const slot = (startsAt: string, remaining: number) => ({ startsAt, endsAt: startsAt, remaining });

const days = [
  {
    date: '2026-11-23',
    slots: [
      slot('2026-11-23T11:00:00.000Z', 2),
      slot('2026-11-23T11:10:00.000Z', 1),
      slot('2026-11-23T20:00:00.000Z', 5),
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

const apiError = (status: number, code: string, fields: Record<string, string> = {}) => ({
  status,
  body: { code, message: `API: ${code}`, fields },
});

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

const field = (name: string) => screen.getByRole('combobox', { name });

const optionsOf = (name: string) =>
  within(field(name))
    .getAllByRole('option')
    .filter((option) => !(option as HTMLOptionElement).disabled)
    .map((option) => option.textContent);

async function start() {
  const view = renderApp('/paciente/exames/novo');
  await screen.findByRole('option', { name: 'Hemograma' });
  return view;
}

type User = Awaited<ReturnType<typeof start>>['user'];

async function fill(user: User) {
  await user.selectOptions(field('Tipo de exame'), 'Hemograma');
  await user.click(await screen.findByRole('radio', { name: /Unidade Sul/ }));
  await waitFor(() => expect(field('Data')).toBeEnabled());
  await user.selectOptions(field('Data'), 'seg., 23/11');
  await user.selectOptions(field('Horário'), '08:00 · 2 vagas');
}

const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Agendar Exame' }));

const unitCalls = (calls: ReturnType<typeof serve>['calls']) =>
  calls.filter((call) => call.url.pathname === '/api/units').length;

describe('book exam', { timeout: 15_000 }, () => {
  it('lists the units of the chosen type and enables the date and time after both', async () => {
    const { calls } = serve();
    const { user } = await start();
    expect(screen.getByText('Escolha o tipo de exame para ver os locais.')).toBeVisible();
    expect(field('Data')).toBeDisabled();

    await user.selectOptions(field('Tipo de exame'), 'Raio-X');
    const group = await screen.findByRole('group', { name: 'Local do exame' });
    expect(within(group).getAllByRole('radio')).toHaveLength(1);
    expect(field('Data')).toBeDisabled();

    await user.selectOptions(field('Tipo de exame'), 'Hemograma');
    const south = await screen.findByRole('radio', { name: /Unidade Sul/ });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    expect(south).toHaveAccessibleName(/Av\. Ipiranga, 987/);
    await user.click(south);

    await waitFor(() => expect(optionsOf('Data')).toEqual(['seg., 23/11']));
    await user.selectOptions(field('Data'), 'seg., 23/11');
    expect(optionsOf('Horário')).toEqual(['08:00 · 2 vagas', '08:10 · 1 vaga', '17:00']);
    const availability = calls.filter((call) => call.url.pathname === '/api/exam-availability');
    expect(availability.at(-1)?.url.searchParams.get('unitId')).toBe('u2');
    expect(availability.at(-1)?.url.searchParams.get('examTypeId')).toBe('e1');
  });

  it('moves between units with the arrow keys', async () => {
    serve();
    const { user } = await start();
    await user.selectOptions(field('Tipo de exame'), 'Hemograma');
    await user.click(await screen.findByRole('radio', { name: /Unidade Central/ }));

    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: /Unidade Sul/ })).toBeChecked();
  });

  it('clears the unit, date and time when the type changes', async () => {
    serve();
    const { user } = await start();
    await fill(user);

    await user.selectOptions(field('Tipo de exame'), 'Raio-X');

    await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(1));
    expect(screen.getByRole('radio', { name: /Unidade Central/ })).not.toBeChecked();
    expect(field('Data')).toHaveValue('');
    expect(field('Data')).toBeDisabled();
    expect(field('Horário')).toHaveValue('');
  });

  it('shows the availability error and reloads the units when the offer is gone', async () => {
    const { calls } = serve(undefined, undefined, {
      '/api/exam-availability': () => apiError(404, 'NOT_FOUND'),
    });
    const { user } = await start();
    await user.selectOptions(field('Tipo de exame'), 'Hemograma');
    const south = await screen.findByRole('radio', { name: /Unidade Sul/ });
    const before = unitCalls(calls);
    await user.click(south);

    expect(
      await screen.findByText('Este exame não está mais disponível neste local. Escolha outro.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    await waitFor(() => expect(unitCalls(calls)).toBeGreaterThan(before));
    expect(field('Data')).toBeDisabled();
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
    await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(1));
    expect(screen.getByRole('group', { name: 'Local do exame' })).toHaveAccessibleDescription(
      'Este local não faz mais este exame. Escolha outro.',
    );
    expect(field('Data')).toHaveValue('');
    expect(field('Horário')).toHaveValue('');
  });

  it('shows the preparation notes of the chosen type', async () => {
    serve();
    const { user } = await start();

    await user.selectOptions(field('Tipo de exame'), 'Hemograma');

    expect(field('Tipo de exame')).toHaveAccessibleDescription('Preparo: Jejum de 8 horas.');
    await user.selectOptions(field('Tipo de exame'), 'Raio-X');
    expect(field('Tipo de exame')).not.toHaveAccessibleDescription();
  });

  it('books the exam and shows the public code', async () => {
    const { calls } = serve();
    const { user } = await start();
    await fill(user);
    await user.type(screen.getByRole('textbox', { name: 'Observações (opcional)' }), ' Levo o pedido. ');

    await submit(user);

    const dialog = await screen.findByRole('dialog', { name: 'Exame agendado!' });
    expect(dialog).toHaveAccessibleDescription(
      'Hemograma em Unidade Sul, 23/11/2026, 08:00. Apresente o código EX-7F3K2Q na unidade.',
    );
    const details = within(dialog).getByRole('link', { name: 'Ver detalhes' });
    expect(details).toHaveAttribute('href', '/paciente/agendamentos');
    expect(details).toHaveFocus();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      examTypeId: 'e1',
      unitId: 'u2',
      startsAt: '2026-11-23T11:00:00.000Z',
      notes: 'Levo o pedido.',
    });
    expect(field('Tipo de exame')).toHaveValue('');
  });

  it('reloads the free slots and keeps the form when the last place was taken', async () => {
    const remaining = [{ date: '2026-11-23', slots: [slot('2026-11-23T20:00:00.000Z', 5)] }];
    const { availabilityLoads } = serve(
      () => apiError(409, 'NO_CAPACITY', { startsAt: 'API' }),
      [days, remaining],
    );
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Não há mais vagas neste horário. Escolha outro.');
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveValue('');
    await waitFor(() => expect(optionsOf('Horário')).toEqual(['17:00']));
    expect(availabilityLoads()).toBe(2);
    expect(field('Tipo de exame')).toHaveValue('e1');
    expect(screen.getByRole('radio', { name: /Unidade Sul/ })).toBeChecked();
    expect(field('Data')).toHaveValue('2026-11-23');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts the API field errors on their fields', async () => {
    serve(() => apiError(400, 'VALIDATION_ERROR', { notes: 'Use até 500 caracteres.' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    const message = await screen.findByText('Use até 500 caracteres.');
    const notes = screen.getByRole('textbox', { name: 'Observações (opcional)' });
    expect(notes).toHaveAttribute('aria-describedby', message.id);
    expect(notes).toHaveFocus();
  });

  it('warns when the patient reached the limit of active bookings', async () => {
    serve(() => apiError(422, 'ACTIVE_LIMIT', { _root: 'API' }));
    const { user } = await start();
    await fill(user);

    await submit(user);

    expect(await screen.findByText(/limite de agendamentos ativos/)).toHaveAttribute('role', 'alert');
    expect(field('Horário')).toHaveValue('2026-11-23T11:00:00.000Z');
  });

  it('asks for every field before sending', async () => {
    const { calls } = serve();
    const { user } = await start();

    await submit(user);

    expect(await screen.findByText('Preencha todas as informações.')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Escolha o tipo de exame.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Local do exame' })).toHaveAccessibleDescription(
      /Escolha o local do exame\./,
    );
    expect(field('Tipo de exame')).toHaveFocus();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });
});
