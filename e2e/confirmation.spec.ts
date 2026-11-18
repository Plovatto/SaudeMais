import type { Page } from '@playwright/test';
import { civilDateInSaoPaulo, formatShortDay, formatTime } from '../src/lib/date';
import { api } from './support/api';
import { tokenFor } from './support/auth';
import { bookingCard, expect, expectAccessible, test } from './support/fixtures';

const DOCTOR_NAME = 'Dr. João Silveira';
const PATIENT_NAME = 'Ana Maria Silva';

const bell = (page: Page) => page.getByRole('button', { name: /^Notificações/ });

test('the doctor confirms a request and the patient is notified', async ({ signedIn }) => {
  const token = await tokenFor('patient');
  const doctor = await api.doctor(token, DOCTOR_NAME);
  const { startsAt } = await api.bookAppointment(token, {
    doctorId: doctor.id,
    specialtyId: doctor.specialty.id,
    visitType: 'routine',
    startsAt: await api.firstFreeSlot(token, doctor.id),
  });
  const unread = await api.unreadCount(token, 'patient');

  const patientPage = await signedIn('patient');
  await patientPage.goto('paciente');
  await expect(bell(patientPage)).toHaveAccessibleName(
    unread === 0 ? 'Notificações' : new RegExp(`, ${unread} `),
  );

  const doctorPage = await signedIn('doctor');
  await doctorPage.goto(`medico/agenda?dia=${civilDateInSaoPaulo(new Date(startsAt))}`);
  await bookingCard(doctorPage, PATIENT_NAME, formatTime(startsAt)).getByRole('button').click();
  const confirm = doctorPage.getByRole('button', { name: /^Confirmar/ }).locator('visible=true');
  await expect(confirm).toBeVisible();
  await expectAccessible(doctorPage);
  await confirm.click();
  await expect(doctorPage.getByText('Consulta confirmada.')).toBeVisible();
  await expect(confirm).toBeHidden();

  await expect.poll(() => api.unreadCount(token, 'patient')).toBe(unread + 1);
  await patientPage.reload();
  await expect(bell(patientPage)).toHaveAccessibleName(new RegExp(`, ${unread + 1} não lidas?$`));
  await bell(patientPage).click();
  const notifications = patientPage.getByRole('dialog', { name: 'Notificações' });
  await expect(notifications.getByText('Consulta confirmada!').first()).toBeVisible();
  await expectAccessible(patientPage);

  await patientPage.goto('paciente/agendamentos?tipo=consulta&status=confirmado');
  await expect(
    bookingCard(patientPage, DOCTOR_NAME, formatShortDay(startsAt), formatTime(startsAt)),
  ).toContainText('Confirmado');
});
