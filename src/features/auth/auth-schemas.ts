import { z } from 'zod';

const E164 = /^\+[1-9][0-9]{9,14}$/;

const codePoints = (value: string) => [...value].length;

const hasControlCharacter = (value: string) =>
  [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 32 || code === 127;
  });

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (value.startsWith('+')) return `+${digits}`;
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : `+${digits}`;
}

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.').max(254, 'O e-mail pode ter até 254 caracteres.'));

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
      .refine((value) => !hasControlCharacter(value), 'O nome não pode ter caracteres de controle.')
      .refine(
        (value) => codePoints(value) >= 2 && codePoints(value) <= 120,
        'Informe seu nome completo (2 a 120 caracteres).',
      ),
    email,
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || E164.test(normalizePhone(value)),
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
