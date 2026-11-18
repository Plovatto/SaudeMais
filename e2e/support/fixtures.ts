import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { storageStateFor, type ExampleRole } from './auth';
import type { Person } from './people';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

export const test = base.extend<{ signedIn: (role: ExampleRole) => Promise<Page> }>({
  signedIn: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (role) => {
      const context = await browser.newContext({ storageState: storageStateFor(role) });
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

export { expect };

export async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const blocking = violations
    .filter(({ impact }) => impact && BLOCKING_IMPACTS.has(impact))
    .map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ html, failureSummary }) => ({ html, failureSummary })),
    }));
  expect(blocking).toEqual([]);
}

export async function signIn(page: Page, { email, password }: Pick<Person, 'email' | 'password'>) {
  const form = page.getByRole('form', { name: 'Entrar' });
  await form.getByRole('textbox', { name: 'E-mail' }).fill(email);
  await form.getByLabel('Senha', { exact: true }).fill(password);
  await form.getByRole('button', { name: 'Entrar' }).click();
}

export const openFromNav = (page: Page, label: string) =>
  page
    .getByRole('navigation', { name: /^(Menu|Principal)$/ })
    .getByRole('link', { name: label, exact: true })
    .locator('visible=true')
    .first()
    .click();

export const bookingCard = (page: Page, ...texts: string[]) =>
  texts.reduce((cards, text) => cards.filter({ hasText: text }), page.getByRole('listitem'));

export async function pickOption(scope: Locator, label: string, option: string) {
  await scope.getByRole('button', { name: new RegExp(`^${label} `) }).click();
  await scope.getByRole('listbox', { name: label }).getByRole('option', { name: option }).click();
}

export const pickFirstDay = (form: Locator) =>
  form.getByRole('group', { name: 'Calendário' }).locator('button[aria-pressed]').first().click();

export const freeSlots = (form: Locator) =>
  form.getByRole('radiogroup', { name: 'Horários livres' }).getByRole('radio');
