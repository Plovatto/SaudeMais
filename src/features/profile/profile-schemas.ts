import { z } from 'zod';
import { todayInSaoPaulo } from '@lib/date';
import {
  confirmationMatches,
  hasLettersAndNumbers,
  newPasswordFields,
  personalDataBody,
  personalDataSchema,
  personalDataValues,
} from '@lib/validation/account-fields';
import type { ProfileBody } from './profile-api';

export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Informe a senha atual.')
      .max(128, 'A senha pode ter até 128 caracteres.'),
    ...newPasswordFields,
  })
  .refine(...confirmationMatches)
  .refine((data) => hasLettersAndNumbers(data.password), {
    path: ['password'],
    message: 'A senha precisa ter letras e números.',
  })
  .refine((data) => data.password !== data.currentPassword, {
    path: ['password'],
    message: 'A nova senha precisa ser diferente da atual.',
  });

export type PasswordValues = z.infer<typeof passwordSchema>;

const EARLIEST_BIRTH_DATE = '1900-01-01';

export const birthDateLimits = () => ({ min: EARLIEST_BIRTH_DATE, max: todayInSaoPaulo() });

export const profileSchema = personalDataSchema.extend({
  birthDate: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) && value >= EARLIEST_BIRTH_DATE && value <= todayInSaoPaulo()),
      'Informe uma data de nascimento entre 1900 e hoje.',
    ),
});

export type ProfileValues = z.infer<typeof profileSchema>;

interface ProfileData {
  fullName: string;
  phone: string | null;
  birthDate: string | null;
}

export const profileValues = (user: ProfileData): ProfileValues => ({
  ...personalDataValues(user),
  birthDate: user.birthDate ?? '',
});

export const profileBody = (values: ProfileValues, withBirthDate: boolean): ProfileBody => ({
  ...personalDataBody(values),
  ...(withBirthDate && { birthDate: values.birthDate || null }),
});
