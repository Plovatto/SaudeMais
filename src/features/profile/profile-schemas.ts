import { z } from 'zod';
import { confirmationMatches, newPasswordFields } from '@lib/validation/account-fields';

export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Informe a senha atual.')
      .max(128, 'A senha pode ter até 128 caracteres.'),
    ...newPasswordFields,
  })
  .refine(...confirmationMatches);

export type PasswordValues = z.infer<typeof passwordSchema>;
