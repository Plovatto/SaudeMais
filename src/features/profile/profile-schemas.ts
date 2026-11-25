import { z } from 'zod';
import { addYears, isDateWithin, todayInSaoPaulo, type DateLimits } from '@lib/date';
import {
  confirmationMatches,
  hasLettersAndNumbers,
  newPasswordFields,
  PASSWORD_MAX,
  PASSWORD_MAX_MESSAGE,
  personalDataBody,
  personalDataSchema,
  personalDataValues,
} from '@lib/validation/account-fields';
import type { ProfileBody } from './profile-api';

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.').max(PASSWORD_MAX, PASSWORD_MAX_MESSAGE),
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

export const MAX_AGE_YEARS = 120;

export function birthDateLimits(today = todayInSaoPaulo()): DateLimits {
  return { min: addYears(today, -MAX_AGE_YEARS), max: today };
}

export const profileSchema = personalDataSchema.extend({
  birthDate: z
    .string()
    .refine(
      (value) => value === '' || isDateWithin(value, birthDateLimits()),
      `Informe uma data de nascimento de até ${MAX_AGE_YEARS} anos atrás, sem passar de hoje.`,
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
