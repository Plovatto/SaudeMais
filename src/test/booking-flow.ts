import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export const dropdown = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label} `) });

export async function pick(user: UserEvent, label: string, option: string) {
  await user.click(dropdown(label));
  const list = await screen.findByRole('listbox', { name: label });
  await user.click(within(list).getByRole('option', { name: new RegExp(`^${option}`) }));
}

export const calendar = () => screen.getByRole('group', { name: 'Calendário' });

export const openDays = () =>
  within(calendar())
    .getAllByRole('button')
    .filter((day) => day.hasAttribute('aria-pressed'))
    .map((day) => day.getAttribute('aria-label'));

export const pickedDay = () =>
  within(calendar())
    .queryAllByRole('button', { pressed: true })
    .map((day) => day.getAttribute('aria-label'))[0];

export const slotGroup = () => screen.getByRole('radiogroup', { name: 'Horários livres' });

export const slotTimes = () =>
  within(slotGroup())
    .getAllByRole('radio')
    .filter((slot) => !slot.hasAttribute('disabled'))
    .map((slot) => slot.textContent);

export async function pickDay(user: UserEvent, label: string) {
  await user.click(
    await within(await screen.findByRole('group', { name: 'Calendário' })).findByRole('button', {
      name: label,
    }),
  );
}

export async function pickTime(user: UserEvent, time: string) {
  const period = screen.queryByRole('group', { name: 'Período' });
  const hour = Number(time.slice(0, 2));
  const name = hour < 12 ? /^Manhã/ : hour < 18 ? /^Tarde/ : /^Noite/;
  if (period) await user.click(within(period).getByRole('button', { name }));
  await user.click(within(slotGroup()).getByRole('radio', { name: new RegExp(`^${time}`) }));
}
