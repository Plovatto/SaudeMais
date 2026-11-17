import { bookingCard, expect, expectAccessible, openFromNav, signIn, test } from './support/fixtures';
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
  await form.getByRole('combobox', { name: 'Médico' }).selectOption({ label: DOCTOR });
  await form.getByRole('combobox', { name: 'Tipo de consulta' }).selectOption({ label: 'Primeira consulta' });
  await form.getByRole('combobox', { name: 'Data' }).selectOption({ index: 1 });
  await form.getByRole('combobox', { name: 'Horário' }).selectOption({ index: 1 });
  await expectAccessible(page);
  await form.getByRole('button', { name: 'Agendar Consulta' }).click();

  const booked = page.getByRole('dialog', { name: 'Pedido enviado, aguardando confirmação' });
  await expect(booked).toBeVisible();
  await expectAccessible(page);
  await booked.getByRole('link', { name: 'Ver detalhes' }).click();

  await expect(page.getByRole('tab', { name: /Agendados/, selected: true })).toBeVisible();
  await expect(bookingCard(page, DOCTOR)).toContainText('Pendente');
  await expectAccessible(page);
});
