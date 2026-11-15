import { z } from 'zod';
import { choice, emptySlot, slotShape } from '@components/booking-form/slot-schema';

export const examSchema = z.object({
  examTypeId: choice('Escolha o tipo de exame.'),
  unitId: choice('Escolha o local do exame.'),
  ...slotShape,
});

export const emptyExam: z.input<typeof examSchema> = { examTypeId: '', unitId: '', ...emptySlot };
