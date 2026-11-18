import type { Role } from './areas';

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  roles: readonly Role[];
}

export const DEMO_PATIENT: DemoAccount = {
  label: 'Paciente',
  email: 'paciente@saudemais.test',
  password: 'paciente-demo-123',
  roles: ['patient'],
};

export const DEMO_DOCTOR: DemoAccount = {
  label: 'Médico',
  email: 'medico@saudemais.test',
  password: 'medico-demo-123',
  roles: ['doctor', 'patient'],
};

export const DEMO_ACCOUNTS = [DEMO_PATIENT, DEMO_DOCTOR] as const;
