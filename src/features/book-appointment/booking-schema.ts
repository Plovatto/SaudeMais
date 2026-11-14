import { z } from 'zod';

export const NOTES_MAX = 500;

export const visitType = z.enum(['first_visit', 'routine', 'follow_up', 'exam_review']);

export const visitTypeLabels: Record<z.infer<typeof visitType>, string> = {
  first_visit: 'Primeira consulta',
  routine: 'Rotina',
  follow_up: 'Retorno',
  exam_review: 'Avaliação de exames',
};

const choice = (message: string) => z.string().min(1, message);

export const bookingSchema = z.object({
  doctorId: choice('Escolha o médico.'),
  specialtyId: choice('Escolha a especialidade.'),
  visitType: choice('Escolha o tipo de consulta.').pipe(visitType),
  date: choice('Escolha a data.'),
  startsAt: choice('Escolha o horário.'),
  notes: z.string().trim().max(NOTES_MAX, `Use até ${NOTES_MAX} caracteres.`),
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
