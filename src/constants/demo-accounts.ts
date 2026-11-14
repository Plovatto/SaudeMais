export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

export const DEMO_PATIENT: DemoAccount = {
  label: 'Paciente',
  email: 'paciente@saudemais.test',
  password: 'paciente-demo-123',
};

export const DEMO_DOCTOR: DemoAccount = {
  label: 'Médico',
  email: 'medico@saudemais.test',
  password: 'medico-demo-123',
};

export const DEMO_ACCOUNTS = [DEMO_PATIENT, DEMO_DOCTOR] as const;

export const isDemoEmail = (email: string) => DEMO_ACCOUNTS.some((account) => account.email === email);
