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

export const EXAMPLE_ALL_PROFILES: ExampleAccount = {
  label: 'Conta completa',
  email: 'admin@saudemais.com',
  password: 'completo-demo-123',
  roles: ['patient', 'doctor', 'admin'],
};

export const EXAMPLE_ACCOUNTS = [EXAMPLE_ALL_PROFILES] as const;
