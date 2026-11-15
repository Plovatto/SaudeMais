import { z } from 'zod';
import { choice, emptySlot, slotShape } from '@components/booking-form/slot-schema';
import { VISIT_TYPES } from '@constants/visit-types';

export const bookingSchema = z.object({
  doctorId: choice('Escolha o médico.'),
  specialtyId: choice('Escolha a especialidade.'),
  visitType: choice('Escolha o tipo de consulta.').pipe(z.enum(VISIT_TYPES)),
  ...slotShape,
});

export const emptyBooking: z.input<typeof bookingSchema> = {
  doctorId: '',
  specialtyId: '',
  visitType: '',
  ...emptySlot,
};
