import { hourInSaoPaulo } from './date';

export const DAY_PERIODS = [
  { id: 'manha', label: 'Manhã', until: 12 },
  { id: 'tarde', label: 'Tarde', until: 18 },
  { id: 'noite', label: 'Noite', until: 24 },
] as const;

export type DayPeriod = (typeof DAY_PERIODS)[number];

export const dayPeriodOf = (startsAt: string): DayPeriod => {
  const hour = hourInSaoPaulo(startsAt);
  return DAY_PERIODS.find(({ until }) => hour < until) ?? DAY_PERIODS[2];
};
