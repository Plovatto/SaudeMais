import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayInSaoPaulo } from '@lib/date';
import { renderApp, serveApi, type MockResponse } from '@/test/render-app';

const CURRENT = '2026-11-23T17:30:00.000Z';
const LIST_LINK = 'Voltar para meus agendamentos';

const unit = { id: 'u1', name: 'Unidade Central', address: 'Rua das Flores, 123', phone: '+551133334444' };

const actions = {
  canCancel: true,
  lateCancellation: false,
  cancelBlockedReason: null,
  canReschedule: true,
  rescheduleBlockedReason: null,
  reschedulesLeft: 2,
};

const appointment = {
  id: 'a1',
  status: 'confirmed',
  visitType: 'routine',
  startsAt: CURRENT,
  endsAt: '2026-11-23T18:00:00.000Z',
  notes: null,
  patient: { id: 'p1', fullName: 'Ana Maria Silva' },
  doctor: { id: 'd1', fullName: 'Carlos Mendes' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  unit,
  cancellation: null,
  createdAt: '2026-11-14T12:00:00.000Z',
  actions,
  events: [],
};

const exam = {
  id: 'x1',
  status: 'confirmed',
  publicCode: 'EX-7F3K2Q',
  startsAt: CURRENT,
  endsAt: '2026-11-23T17:40:00.000Z',
  notes: null,
  examType: { id: 'e1', name: 'Hemograma', kind: 'lab', preparationNotes: 'Jejum de 8 horas.' },
  unit,
  cancellation: null,
  createdAt: '2026-11-14T12:00:00.000Z',
  actions,
  events: [],
};

const slot = (startsAt: string) => ({ startsAt, endsAt: startsAt, remaining: 5 });

const days = [
  { date: '2026-11-23', slots: [slot('2026-11-23T11:00:00.000Z'), slot(CURRENT)] },
  { date: '2026-11-24', slots: [slot('2026-11-24T12:00:00.000Z')] },
];

const apiError = (status: number, code: string, fields: Record<string, string> = {}) => ({
  status,
  body: { code, message: `API: ${code}`, fields },
});

const kinds = {
  appointment: {
    path: '/paciente/consultas/a1/reagendar',
    detail: '/api/appointments/a1',
    availability: '/api/doctors/d1/availability',
    booking: appointment,
  },
  exam: {
    path: '/paciente/exames/x1/reagendar',
    detail: '/api/exam-bookings/x1',
    availability: '/api/exam-availability',
    booking: exam,
  },
};

type Kind = keyof typeof kinds;

interface Options {
  kind?: Kind;
  detail?: () => MockResponse;
  reschedule?: () => MockResponse;
  available?: typeof days;
  afterSubmit?: typeof days;
}

function serve({
  kind = 'appointment',
  detail,
  reschedule,
  available = days,
  afterSubmit = available,
}: Options = {}) {
  const target = kinds[kind];
  let submitted = false;
  return serveApi(['patient'], {
    [target.detail]: detail ?? (() => ({ status: 200, body: target.booking })),
    [target.availability]: (_method, _body, url) => {
      if (url.searchParams.get('from') !== todayInSaoPaulo()) return { status: 200, body: { days: [] } };
      return { status: 200, body: { days: submitted ? afterSubmit : available } };
    },
    [`${target.detail}/reschedule`]: () => {
      submitted = true;
      return (
        reschedule?.() ?? {
          status: 200,
          body: { ...target.booking, startsAt: '2026-11-24T12:00:00.000Z' },
        }
      );
    },
  });
}

const alertWith = async (text: string | RegExp) =>
  (await screen.findByText(text)).closest('[role="alert"]') as HTMLElement;

const field = (name: string) => screen.getByRole('combobox', { name });

const enabledOptions = (name: string) =>
  within(field(name))
    .getAllByRole('option')
    .filter((option) => !(option as HTMLOptionElement).disabled)
    .map((option) => option.textContent);

async function start(kind: Kind = 'appointment') {
  const view = renderApp(kinds[kind].path);
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Data' })).toBeEnabled());
  return view;
}

type User = Awaited<ReturnType<typeof start>>['user'];

async function pickNext(user: User) {
  await user.selectOptions(field('Data'), 'ter., 24/11');
  await user.selectOptions(field('Horário'), '09:00');
}

const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Reagendar' }));

describe('reschedule', { timeout: 15_000 }, () => {
  it('locks the doctor and asks for the free slots without the booking itself', async () => {
    const { calls } = serve();
    await start();

    expect(screen.getByRole('heading', { level: 1, name: 'Reagendar consulta' })).toBeVisible();
    const doctor = screen.getByRole('textbox', { name: 'Médico' });
    expect(doctor).toHaveValue('Carlos Mendes');
    expect(doctor).toHaveAttribute('readonly');
    expect(doctor).toHaveAccessibleDescription('Unidade Central · Rua das Flores, 123');
    expect(screen.getByRole('textbox', { name: 'Especialidade' })).toHaveValue('Cardiologia');
    expect(screen.getByRole('textbox', { name: 'Tipo de consulta' })).toHaveValue('Rotina');
    expect(screen.getByRole('textbox', { name: 'Horário atual' })).toHaveValue('23/11/2026, 14:30');
    expect(screen.getByRole('note')).toHaveTextContent('A consulta volta a aguardar confirmação do médico.');
    expect(field('Data')).toHaveValue('2026-11-23');
    const windows = calls.filter((call) => call.url.pathname === kinds.appointment.availability);
    expect(new Set(windows.map((call) => call.url.searchParams.get('from'))).size).toBe(2);
    windows.forEach((call) => expect(call.url.searchParams.get('rescheduling')).toBe('a1'));
  });

  it('tells that a pending appointment keeps waiting for the doctor', async () => {
    serve({ detail: () => ({ status: 200, body: { ...appointment, status: 'pending' } }) });
    await start();

    expect(screen.getByRole('note')).toHaveTextContent('A consulta fica aguardando confirmação do médico.');
  });

  it('leaves out a day whose only free slot is the current one', async () => {
    serve({ available: [{ date: '2026-11-23', slots: [slot(CURRENT)] }, days[1] as (typeof days)[number]] });
    await start();

    expect(enabledOptions('Data')).toEqual(['ter., 24/11']);
    expect(field('Data')).toHaveValue('');
  });

  it('warns when no slot other than the current one is free', async () => {
    serve({ available: [{ date: '2026-11-23', slots: [slot(CURRENT)] }] });
    renderApp(kinds.appointment.path);

    expect(await screen.findByText(/não tem outras vagas livres/)).toBeVisible();
    expect(field('Data')).toBeDisabled();
  });

  it('marks the current time and keeps it out of reach', async () => {
    serve();
    const { user } = await start();

    await user.selectOptions(field('Data'), 'seg., 23/11');

    const current = within(field('Horário')).getByRole('option', { name: '14:30 · Horário atual' });
    expect(current).toBeDisabled();
    expect(enabledOptions('Horário')).toEqual(['08:00']);
  });

  it('sends the current and the new start and shows the appointment back to pending', async () => {
    const { calls } = serve();
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const dialog = await screen.findByRole('dialog', { name: 'Consulta reagendada' });
    expect(dialog).toHaveAccessibleDescription(
      'Consulta de Cardiologia com Carlos Mendes em 24/11/2026, 09:00. Avisaremos quando o médico confirmar.',
    );
    expect(within(dialog).getByRole('link', { name: 'Ver detalhes' })).toHaveAttribute(
      'href',
      '/paciente/agendamentos',
    );
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url.pathname).toBe('/api/appointments/a1/reschedule');
    expect(post?.body).toEqual({ startsAt: CURRENT, newStartsAt: '2026-11-24T12:00:00.000Z' });
  });

  it('reschedules an exam with the type and the place locked', async () => {
    const { calls } = serve({ kind: 'exam' });
    const { user } = await start('exam');

    expect(screen.getByRole('heading', { level: 1, name: 'Reagendar exame' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Tipo de exame' })).toHaveAccessibleDescription(
      'Preparo: Jejum de 8 horas.',
    );
    expect(screen.getByRole('textbox', { name: 'Local do exame' })).toHaveValue('Unidade Central');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    const params = calls.find((call) => call.url.pathname === kinds.exam.availability)?.url.searchParams;
    expect(params?.get('rescheduling')).toBe('x1');
    expect(params?.get('unitId')).toBe('u1');
    expect(params?.get('examTypeId')).toBe('e1');

    await pickNext(user);
    await submit(user);

    const dialog = await screen.findByRole('dialog', { name: 'Exame reagendado' });
    expect(dialog).toHaveAccessibleDescription(
      'Hemograma em Unidade Central, 24/11/2026, 09:00. Apresente o código EX-7F3K2Q na unidade.',
    );
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url.pathname).toBe('/api/exam-bookings/x1/reschedule');
    expect(post?.body).toEqual({ startsAt: CURRENT, newStartsAt: '2026-11-24T12:00:00.000Z' });
  });

  it.each([
    ['SAME_SLOT', 422, 'Escolha um horário diferente do atual.'],
    ['PATIENT_CONFLICT', 409, 'Você já tem um agendamento neste horário. Escolha outro.'],
  ])('puts %s on the time field', async (code, status, text) => {
    serve({ reschedule: () => apiError(status, code, { newStartsAt: 'API' }) });
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const message = await screen.findByText(text);
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveFocus();
  });

  it.each([
    ['RESCHEDULE_WINDOW_CLOSED', /Você ainda pode cancelá-lo\./],
    ['RESCHEDULE_LIMIT', /reagendado o máximo de vezes permitido/],
    ['INVALID_STATE', /Este agendamento mudou/],
    ['NOT_FOUND', /não pode mais ser reagendado\. Confira a lista/],
  ])('explains %s and leaves only the way back to the list', async (code, text) => {
    serve({ reschedule: () => apiError(code === 'NOT_FOUND' ? 404 : 409, code, { _root: 'API' }) });
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const alert = await alertWith(text);
    expect(within(alert).getByRole('link', { name: LIST_LINK })).toHaveAttribute(
      'href',
      '/paciente/agendamentos',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reagendar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Horário' })).not.toBeInTheDocument();
  });

  it('puts a validation error on the new start on the time field', async () => {
    serve({ reschedule: () => apiError(400, 'VALIDATION_ERROR', { newStartsAt: 'Horário inválido.' }) });
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const message = await screen.findByText('Horário inválido.');
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveFocus();
  });

  it('reloads the free slots and keeps the day when the new slot was just taken', async () => {
    const remaining = [{ date: '2026-11-24', slots: [slot('2026-11-24T13:00:00.000Z')] }];
    const { calls } = serve({
      reschedule: () => apiError(409, 'SLOT_TAKEN', { newStartsAt: 'API' }),
      afterSubmit: remaining,
    });
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(field('Horário')).toHaveAttribute('aria-describedby', message.id);
    expect(field('Horário')).toHaveValue('');
    await waitFor(() => expect(enabledOptions('Horário')).toEqual(['10:00']));
    const post = calls.findIndex((call) => call.method === 'POST');
    expect(calls.slice(post).some((call) => call.url.pathname === kinds.appointment.availability)).toBe(true);
    expect(field('Data')).toHaveValue('2026-11-24');
    expect(screen.queryByRole('link', { name: LIST_LINK })).not.toBeInTheDocument();
  });

  it('explains a booking that can no longer be rescheduled instead of the form', async () => {
    serve({
      detail: () => ({
        status: 200,
        body: {
          ...appointment,
          actions: { ...actions, canReschedule: false, rescheduleBlockedReason: 'window_closed' },
        },
      }),
    });
    renderApp(kinds.appointment.path);

    const note = await screen.findByRole('note');
    expect(note).toHaveTextContent(/não pode mais ser reagendado, só cancelado/);
    expect(within(note).getByRole('link', { name: LIST_LINK })).toBeVisible();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('explains a booking that no longer exists', async () => {
    serve({ detail: () => apiError(404, 'NOT_FOUND') });
    renderApp(kinds.appointment.path);

    const note = await screen.findByRole('note');
    expect(note).toHaveTextContent(
      'Este agendamento não pode mais ser reagendado. Confira a lista atualizada.',
    );
    expect(within(note).getByRole('link', { name: LIST_LINK })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument();
  });
});
