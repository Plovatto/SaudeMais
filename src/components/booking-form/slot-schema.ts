import { z } from 'zod';
import { freeText } from '@lib/validation/text';

export const choice = (message: string) => z.string().min(1, message);

export const slotShape = {
  date: choice('Escolha a data.'),
  startsAt: choice('Escolha o horário.'),
  notes: freeText(),
};

export const emptySlot = { date: '', startsAt: '', notes: '' };

export const toBody = <T extends { date: string; notes: string }>({ date: _date, notes, ...values }: T) => ({
  ...values,
  ...(notes && { notes }),
});
