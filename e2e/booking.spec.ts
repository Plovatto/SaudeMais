import {
  bookingCard,
  expect,
  expectAccessible,
  freeSlots,
  openFromNav,
  pickFirstDay,
  pickOption,
  signIn,
  test,
} from './support/fixtures';
import { newPerson } from './support/people';

const DOCTOR = 'Dr. Carlos Mendes';

test('a new patient signs up, signs in and books an appointment', async ({ page }) => {
  const patient = newPerson('Paciente');

  await page.goto('cadastro');
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('textbox', { name: 'Nome completo' }).fill(patient.fullName);
  await page.getByRole('textbox', { name: 'E-mail' }).fill(patient.email);
  await page.getByLabel('Senha', { exact: true }).fill(patient.password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(patient.password);
  await page.getByRole('checkbox', { name: /Aceito os termos de uso/ }).check();
  await page.getByRole('button', { name: 'Cadastrar-se' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('textbox', { name: 'E-mail' })).toHaveValue(patient.email);
  await expectAccessible(page);
  await signIn(page, patient);

  await expect(page).toHaveURL(/\/paciente$/);
  await openFromNav(page, 'Agendar consulta');
  const form = page.getByRole('form', { name: 'Dados da consulta' });
  await form.getByRole('searchbox', { name: 'Buscar médico' }).fill(DOCTOR);
  await form.getByRole('radio', { name: DOCTOR }).click();
  await pickOption(form, 'Tipo de consulta', 'Primeira consulta');
  await pickFirstDay(form);
  await freeSlots(form).first().click();
  await expectAccessible(page);
  await form.getByRole('button', { name: /^Agendar/ }).click();

  await expect(page.getByText('Pedido enviado. Avisaremos quando o médico confirmar.')).toBeVisible();
  await expect(page).toHaveURL(/\/paciente\/agendamentos\?id=/);

  await expect(page.getByRole('tab', { name: /Próximos/, selected: true })).toBeVisible();
  await expect(bookingCard(page, DOCTOR)).toContainText('Pendente');
  await expectAccessible(page);
});
