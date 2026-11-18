import type { Role } from './areas';

export interface ExampleAccount {
  label: string;
  email: string;
  password: string;
  roles: readonly Role[];
}

export const EXAMPLE_PATIENT: ExampleAccount = {
  label: 'Paciente',
  email: 'paciente@saudemais.test',
  password: 'paciente-demo-123',
  roles: ['patient'],
};

export const EXAMPLE_DOCTOR: ExampleAccount = {
  label: 'Médico',
  email: 'medico@saudemais.test',
  password: 'medico-demo-123',
  roles: ['doctor', 'patient'],
};

export const EXAMPLE_ACCOUNTS = [EXAMPLE_PATIENT, EXAMPLE_DOCTOR] as const;
