import { randomInt } from 'node:crypto';
import { api } from './support/api';
import { admin } from './support/env';
import {
  expect,
  expectAccessible,
  freeSlots,
  openFromNav,
  pickFirstDay,
  signIn,
  test,
} from './support/fixtures';
import { newPerson } from './support/people';

const MORNINGS = { isActive: true, ranges: [{ startMin: 8 * 60, endMin: 12 * 60 }] };
const WEEKDAYS = [1, 2, 3, 4, 5];

test('the admin makes a user a doctor and patients can book the new free slots', async ({
  page,
  signedIn,
}) => {
  const person = newPerson('Médico');
  await api.register(person);

  await page.goto('login');
  await signIn(page, admin());
  await page.getByRole('link', { name: /Administrador/ }).click();
  await openFromNav(page, 'Usuários');
  await page.getByRole('searchbox', { name: 'Buscar usuários' }).fill(person.fullName);
  await expect(page.getByText('1 usuário encontrado')).toBeVisible();
  await page.getByRole('button', { name: person.fullName }).click();
  const panel = page.getByRole('dialog', { name: 'Editar usuário' });
  await expect(panel.getByRole('textbox', { name: 'Nome completo' })).toHaveValue(person.fullName);
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Tornar médico' }).click();

  const doctorForm = page.getByRole('dialog', { name: 'Tornar médico' });
  await doctorForm.getByRole('combobox', { name: 'Especialidade' }).selectOption({ label: 'Dermatologia' });
  await doctorForm
    .getByRole('textbox', { name: 'Número do CRM' })
    .fill(String(randomInt(100_000, 1_000_000)));
  await doctorForm.getByRole('combobox', { name: 'UF' }).selectOption('SP');
  await doctorForm.getByRole('combobox', { name: 'Unidade' }).selectOption({ label: 'Unidade Sul' });
  await expectAccessible(page);
  await doctorForm.getByRole('button', { name: 'Tornar médico' }).click();
  await expect(page.getByText(`${person.fullName} agora tem perfil de médico.`)).toBeVisible();

  await api.saveSchedule(await api.login(person), {
    days: Array.from({ length: 7 }, (_, weekday) =>
      WEEKDAYS.includes(weekday) ? { weekday, ...MORNINGS } : { weekday, isActive: false, ranges: [] },
    ),
  });

  const patientPage = await signedIn('patient');
  await patientPage.goto('paciente/consultas/nova');
  const form = patientPage.getByRole('form', { name: 'Dados da consulta' });
  await form.getByRole('searchbox', { name: 'Buscar médico' }).fill(person.fullName);
  await form.getByRole('radio', { name: person.fullName }).click();
  await expect(form.getByRole('button', { name: /^Especialidade / })).toHaveText('Dermatologia');
  await pickFirstDay(form);
  await expect(freeSlots(form).first()).toBeVisible();
});
