import { z } from 'zod';
import { UFS } from '@constants/ufs';

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
