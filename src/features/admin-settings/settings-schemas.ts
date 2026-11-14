import { z } from 'zod';
import { WEEKDAYS } from '@constants/weekdays';
import { isTimeOfDay, toMinutes } from '@lib/time-of-day';
import { boundedText, phoneField } from '@lib/validation/account-fields';

const wholeNumber = (min: number, max: number, message: string) =>
  z.number({ error: message }).int(message).min(min, message).max(max, message);

const fiveMinuteSteps = (min: number, max: number) =>
  wholeNumber(min, max, `Use de ${min} a ${max} minutos.`).refine(
    (value) => value % 5 === 0,
    'Use múltiplos de 5 minutos.',
  );

const catalogName = boundedText(2, 80, 'Informe o nome (2 a 80 caracteres).');

export const specialtySchema = z.object({
  name: catalogName,
  council: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3,10}$/, 'Use a sigla do conselho, com 3 a 10 letras (ex.: CRM).'),
  appointmentDurationMin: fiveMinuteSteps(10, 240),
});

const dayHours = z
  .object({ open: z.boolean(), start: z.string().trim(), end: z.string().trim() })
  .superRefine((day, context) => {
    if (!day.open) return;
    const startValid = isTimeOfDay(day.start) && day.start !== '24:00';
    if (!startValid) context.addIssue({ code: 'custom', path: ['start'], message: 'Use o formato 08:00.' });
    if (!isTimeOfDay(day.end)) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'Use o formato 18:00.' });
    } else if (startValid && toMinutes(day.start) >= toMinutes(day.end)) {
      context.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'O fechamento precisa ser depois da abertura.',
      });
    }
  });

export const unitSchema = z.object({
  name: catalogName,
  address: boundedText(5, 200, 'Informe o endereço (5 a 200 caracteres).'),
  phone: phoneField.refine((value) => value !== '', 'Informe o telefone com DDD.'),
  hours: z.array(dayHours).length(WEEKDAYS.length),
});

export const examTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(
      /^[a-z][a-z0-9_]{1,39}$/,
      'Use letras minúsculas, números e _, começando por letra (ex.: hemograma).',
    ),
  name: catalogName,
  kind: z.enum(['lab', 'imaging'], { error: 'Escolha o tipo.' }),
  durationMin: fiveMinuteSteps(5, 240),
  preparationNotes: z.string().trim().max(1000, 'Use até 1000 caracteres.'),
});

export const offerSchema = z.object({
  examTypeId: z.string().min(1, 'Escolha o exame.'),
  capacityPerSlot: wholeNumber(1, 50, 'Use de 1 a 50 exames ao mesmo tempo.'),
  isActive: z.boolean(),
});

export const policySchema = z.object({
  appointmentLateWindowHours: wholeNumber(0, 168, 'Use de 0 a 168 horas.'),
  examLateWindowHours: wholeNumber(0, 168, 'Use de 0 a 168 horas.'),
  maxReschedules: wholeNumber(0, 10, 'Use de 0 a 10.'),
  bookingHorizonDays: wholeNumber(1, 365, 'Use de 1 a 365 dias.'),
  minLeadMinutes: wholeNumber(0, 10080, 'Use de 0 a 10080 minutos.'),
});

export type SpecialtyValues = z.infer<typeof specialtySchema>;
export type UnitValues = z.infer<typeof unitSchema>;
export type ExamTypeValues = z.infer<typeof examTypeSchema>;
export type OfferValues = z.infer<typeof offerSchema>;
export type PolicyValues = z.infer<typeof policySchema>;
