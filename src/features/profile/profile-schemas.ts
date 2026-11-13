import { z } from 'zod';
import {
  confirmationMatches,
  fullNameField,
  newPasswordFields,
  phoneField,
} from '@lib/validation/account-fields';

export const profileSchema = z.object({ fullName: fullNameField, phone: phoneField });

export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Informe a senha atual.')
      .max(128, 'A senha pode ter até 128 caracteres.'),
    ...newPasswordFields,
  })
  .refine(...confirmationMatches);

export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
