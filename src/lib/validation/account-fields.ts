import { z } from 'zod';
import { formatPhone } from '@lib/phone';
import { boundedText } from './text';

const E164 = /^\+[1-9][0-9]{9,14}$/;

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (value.startsWith('+')) return `+${digits}`;
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : `+${digits}`;
}

export const emailField = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.').max(254, 'O e-mail pode ter até 254 caracteres.'));

export const fullNameField = boundedText(2, 120, 'Informe seu nome completo (2 a 120 caracteres).', {
  controlMessage: 'O nome não pode ter caracteres de controle.',
});

export const phoneField = z
  .string()
  .trim()
  .refine((value) => value === '' || E164.test(normalizePhone(value)), 'Informe um telefone válido com DDD.');

export const personalDataSchema = z.object({ fullName: fullNameField, phone: phoneField });

export type PersonalDataValues = z.infer<typeof personalDataSchema>;

export const personalDataValues = (user: { fullName: string; phone: string | null }): PersonalDataValues => ({
  fullName: user.fullName,
  phone: user.phone ? formatPhone(user.phone) : '',
});

export const personalDataBody = ({ fullName, phone }: PersonalDataValues) => ({
  fullName,
  phone: phone === '' ? null : phone,
});

export const newPasswordFields = {
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(128, 'A senha pode ter até 128 caracteres.'),
  passwordConfirmation: z.string().min(1, 'Confirme a senha.'),
};

type Confirmation = { password: string; passwordConfirmation: string };

export const confirmationMatches: [(data: Confirmation) => boolean, { path: string[]; message: string }] = [
  (data) => data.password === data.passwordConfirmation,
  { path: ['passwordConfirmation'], message: 'As senhas não conferem.' },
];
