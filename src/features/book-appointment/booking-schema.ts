import { z } from 'zod';
import { VISIT_TYPES } from '@constants/visit-types';
import { freeText } from '@lib/validation/text';

const visitType = z.enum(VISIT_TYPES);

const choice = (message: string) => z.string().min(1, message);

export const bookingSchema = z.object({
  doctorId: choice('Escolha o médico.'),
  specialtyId: choice('Escolha a especialidade.'),
  visitType: choice('Escolha o tipo de consulta.').pipe(visitType),
  date: choice('Escolha a data.'),
  startsAt: choice('Escolha o horário.'),
  notes: freeText(),
});

type BookingInput = z.input<typeof bookingSchema>;
type BookingValues = z.output<typeof bookingSchema>;

export const emptyBooking: BookingInput = {
  doctorId: '',
  specialtyId: '',
  visitType: '',
  date: '',
  startsAt: '',
  notes: '',
};

export const toBody = ({ date: _date, notes, ...values }: BookingValues) => ({
  ...values,
  ...(notes && { notes }),
});
