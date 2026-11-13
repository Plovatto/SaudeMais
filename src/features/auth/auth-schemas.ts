import { z } from 'zod';

const codePoints = (value: string) => [...value].length;
const BRAZILIAN_PHONE = /^\+?\d{10,13}$/;

export const TERMS_VERSION = '2026-11-13';

const email = z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
  remember: z.boolean(),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .refine(
        (value) => codePoints(value) >= 2 && codePoints(value) <= 120,
        'Informe seu nome completo (2 a 120 caracteres).',
      ),
    email,
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || BRAZILIAN_PHONE.test(value.replace(/[\s().-]/g, '')),
        'Informe um telefone válido com DDD.',
      ),
    password: z
      .string()
      .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
      .max(128, 'A senha pode ter até 128 caracteres.'),
    passwordConfirmation: z.string().min(1, 'Confirme a senha.'),
    acceptTerms: z
      .boolean()
      .refine(Boolean, 'É preciso aceitar os termos de uso e a política de privacidade.'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem.',
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
