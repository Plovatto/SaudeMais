import { z } from 'zod';
import type { Role } from '@constants/areas';
import { UFS } from '@constants/ufs';
import { emailField, fullNameField, phoneField } from '@lib/validation/account-fields';
import type { CreateUserInput } from './users-api';

const ufs: readonly string[] = UFS;

export const doctorProfileSchema = z.object({
  specialtyId: z.string().min(1, 'Escolha a especialidade.'),
  registryNumber: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{0,9}$/, 'Informe só os números do registro, sem zeros à esquerda (até 10 dígitos).'),
  registryUf: z.string().refine((value) => ufs.includes(value), 'Escolha a UF do registro.'),
  unitId: z.string().min(1, 'Escolha a unidade.'),
});

export type DoctorProfileValues = z.infer<typeof doctorProfileSchema>;

export const DOCTOR_FIELDS = [
  'specialtyId',
  'registryNumber',
  'registryUf',
  'unitId',
] as const satisfies readonly (keyof DoctorProfileValues)[];

export const USER_ROLES = ['patient', 'doctor', 'admin'] as const satisfies readonly Role[];

const draftProfile = z.object({
  specialtyId: z.string(),
  registryNumber: z.string(),
  registryUf: z.string(),
  unitId: z.string(),
});

export const createUserSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    phone: phoneField,
    role: z.enum(USER_ROLES),
    doctorProfile: draftProfile,
  })
  .superRefine(({ role, doctorProfile }, context) => {
    if (role !== 'doctor') return;
    for (const issue of doctorProfileSchema.safeParse(doctorProfile).error?.issues ?? [])
      context.addIssue({ code: 'custom', message: issue.message, path: ['doctorProfile', ...issue.path] });
  });

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const emptyCreateUser: CreateUserValues = {
  fullName: '',
  email: '',
  phone: '',
  role: 'patient',
  doctorProfile: { specialtyId: '', registryNumber: '', registryUf: '', unitId: '' },
};

export const createUserBody = ({
  fullName,
  email,
  phone,
  role,
  doctorProfile,
}: CreateUserValues): CreateUserInput => ({
  fullName,
  email,
  ...(phone && { phone }),
  role,
  ...(role === 'doctor' && {
    doctorProfile: { ...doctorProfile, registryNumber: doctorProfile.registryNumber.trim() },
  }),
});
