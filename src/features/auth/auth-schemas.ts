import { z } from 'zod';
import {
  confirmationMatches,
  emailField,
  fullNameField,
  newPasswordFields,
  phoneField,
} from '@lib/validation/account-fields';

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha.'),
  remember: z.boolean(),
});

export const registerSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    phone: phoneField,
    ...newPasswordFields,
    acceptTerms: z
      .boolean()
      .refine(Boolean, 'É preciso aceitar os termos de uso e a política de privacidade.'),
  })
  .refine(...confirmationMatches);

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object(newPasswordFields).refine(...confirmationMatches);

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
