import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayInSaoPaulo } from '@lib/date';
import { examSlot, openDays, pickDay, pickedDay, pickTime, slotGroup, slotTimes } from '@/test/booking-flow';
import { actions, patientAppointment, unit } from '@/test/patient-fixtures';
import { apiError, renderApp, serveApi, type MockResponse } from '@/test/render-app';

const CURRENT = '2026-11-23T17:30:00.000Z';
const LIST_LINK = 'Voltar para meus agendamentos';

const appointment = patientAppointment({
  status: 'confirmed',
  cancellation: null,
  patientActions: actions(),
  doctorActions: null,
});

const exam = {
  id: 'x1',
  status: 'confirmed',
  publicCode: 'EX-7F3K2Q',
  startsAt: CURRENT,
  endsAt: '2026-11-23T17:40:00.000Z',
  notes: null,
  examType: { id: 'e1', name: 'Hemograma', kind: 'lab', preparationNotes: 'Jejum de 8 horas.' },
  unit: unit(),
  cancellation: null,
  createdAt: '2026-11-14T12:00:00.000Z',
  actions: actions(),
  events: [],
};

const days = [
  { date: '2026-11-23', slots: [examSlot('2026-11-23T11:00:00.000Z'), examSlot(CURRENT)] },
  { date: '2026-11-24', slots: [examSlot('2026-11-24T12:00:00.000Z')] },
];

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

const MONDAY = 'Segunda, 23 de novembro';
const TUESDAY = 'Terça, 24 de novembro';

const lockedCard = () => screen.getByRole('region', { name: 'Seu agendamento' });

async function start(kind: Kind = 'appointment') {
  const view = renderApp(kinds[kind].path);
  await screen.findByRole('group', { name: 'Calendário' });
  return view;
}

type User = Awaited<ReturnType<typeof start>>['user'];

async function pickNext(user: User) {
  await pickDay(user, TUESDAY);
  await pickTime(user, '09:00');
}

const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Confirmar' }));

describe('reschedule', { timeout: 20_000 }, () => {
  it('locks the doctor and asks for the free slots without the booking itself', async () => {
    const { calls } = serve();
    await start();

    expect(screen.getByRole('heading', { level: 1, name: 'Reagendar' })).toBeVisible();
    expect(lockedCard()).toHaveTextContent('Não muda');
    expect(lockedCard()).toHaveTextContent('Carlos Mendes');
    expect(lockedCard()).toHaveTextContent('Cardiologia · Rotina');
    expect(lockedCard()).toHaveTextContent('Unidade CentralRua das Flores, 123');
    expect(screen.getByText('Antes: Seg, 23/11 às 14:30')).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent('A consulta volta a aguardar confirmação do médico.');
    expect(pickedDay()).toBe(MONDAY);
    const windows = calls.filter((call) => call.url.pathname === kinds.appointment.availability);
    expect(new Set(windows.map((call) => call.url.searchParams.get('from'))).size).toBe(2);
    windows.forEach((call) => expect(call.url.searchParams.get('rescheduling')).toBe('a1'));
  });

  it('opens the calendar on the month of the current day', async () => {
    const current = '2026-12-02T17:30:00.000Z';
    serve({
      detail: () => ({ status: 200, body: { ...appointment, startsAt: current } }),
      available: [
        { date: '2026-11-30', slots: [examSlot('2026-11-30T12:00:00.000Z')] },
        { date: '2026-12-02', slots: [examSlot('2026-12-02T12:00:00.000Z'), examSlot(current)] },
      ],
    });
    await start();

    await waitFor(() => expect(pickedDay()).toBe('Quarta, 2 de dezembro'));
    expect(within(screen.getByRole('group', { name: 'Calendário' })).getByText(/dezembro/i)).toBeVisible();
  });

  it('tells that a pending appointment keeps waiting for the doctor', async () => {
    serve({ detail: () => ({ status: 200, body: { ...appointment, status: 'pending' } }) });
    await start();

    expect(screen.getByRole('note')).toHaveTextContent('A consulta fica aguardando confirmação do médico.');
  });

  it('leaves out a day whose only free slot is the current one', async () => {
    serve({
      available: [{ date: '2026-11-23', slots: [examSlot(CURRENT)] }, days[1] as (typeof days)[number]],
    });
    await start();

    await waitFor(() => expect(openDays()).toEqual([TUESDAY]));
    expect(pickedDay()).toBeUndefined();
  });

  it('warns when no slot other than the current one is free', async () => {
    serve({ available: [{ date: '2026-11-23', slots: [examSlot(CURRENT)] }] });
    renderApp(kinds.appointment.path);

    expect(await screen.findByText(/não tem outras vagas livres/)).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Calendário' })).not.toBeInTheDocument();
  });

  it('marks the current time and keeps it out of reach', async () => {
    serve();
    const { user } = await start();

    await user.click(
      within(screen.getByRole('group', { name: 'Período' })).getByRole('button', { name: /^Tarde/ }),
    );

    expect(within(slotGroup()).getByRole('radio', { name: '14:30, atual' })).toBeDisabled();
    expect(slotTimes()).toEqual([]);
    expect(screen.getByText('1 horário livre')).toBeVisible();
  });

  it('sends the current and the new start, tells the doctor must confirm and opens the booking', async () => {
    const { calls } = serve();
    const { user, router } = await start();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveAttribute('aria-disabled', 'true');
    await pickNext(user);
    expect(screen.getByText('Ter, 24/11 às 09:00')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar' })).not.toHaveAttribute('aria-disabled');

    await submit(user);

    expect(await screen.findByText('Pedido de novo horário enviado ao médico.')).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe('/paciente/agendamentos'));
    expect(router.state.location.search).toBe('?id=a1');
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url.pathname).toBe('/api/appointments/a1/reschedule');
    expect(post?.body).toEqual({ startsAt: CURRENT, newStartsAt: '2026-11-24T12:00:00.000Z' });
  });

  it('reschedules an exam with the type and the place locked', async () => {
    const { calls } = serve({ kind: 'exam' });
    const { user, router } = await start('exam');

    expect(lockedCard()).toHaveTextContent('Hemograma');
    expect(lockedCard()).toHaveTextContent('Preparo: Jejum de 8 horas.');
    expect(lockedCard()).toHaveTextContent('Unidade Central');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    const params = calls.find((call) => call.url.pathname === kinds.exam.availability)?.url.searchParams;
    expect(params?.get('rescheduling')).toBe('x1');
    expect(params?.get('unitId')).toBe('u1');
    expect(params?.get('examTypeId')).toBe('e1');

    await pickNext(user);
    await submit(user);

    expect(await screen.findByText('Exame reagendado.')).toBeVisible();
    await waitFor(() => expect(router.state.location.search).toBe('?id=x1'));
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
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    expect(slotGroup()).toHaveFocus();
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
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Horários livres' })).not.toBeInTheDocument();
  });

  it('puts a validation error on the new start on the time field', async () => {
    serve({ reschedule: () => apiError(400, 'VALIDATION_ERROR', { newStartsAt: 'Horário inválido.' }) });
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const message = await screen.findByText('Horário inválido.');
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    expect(slotGroup()).toHaveFocus();
  });

  it('reloads the free slots and keeps the day when the new slot was just taken', async () => {
    const remaining = [{ date: '2026-11-24', slots: [examSlot('2026-11-24T13:00:00.000Z')] }];
    const { calls } = serve({
      reschedule: () => apiError(409, 'SLOT_TAKEN', { newStartsAt: 'API' }),
      afterSubmit: remaining,
    });
    const { user } = await start();
    await pickNext(user);

    await submit(user);

    const message = await screen.findByText('Este horário acabou de ser ocupado. Escolha outro.');
    expect(slotGroup()).toHaveAttribute('aria-describedby', message.id);
    await waitFor(() => expect(slotTimes()).toEqual(['10:00']));
    expect(within(slotGroup()).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    const post = calls.findIndex((call) => call.method === 'POST');
    expect(calls.slice(post).some((call) => call.url.pathname === kinds.appointment.availability)).toBe(true);
    expect(pickedDay()).toBe(TUESDAY);
    expect(screen.queryByRole('link', { name: LIST_LINK })).not.toBeInTheDocument();
  });

  it('explains a booking that can no longer be rescheduled instead of the form', async () => {
    serve({
      detail: () => ({
        status: 200,
        body: {
          ...appointment,
          patientActions: actions({ canReschedule: false, rescheduleBlockedReason: 'window_closed' }),
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
