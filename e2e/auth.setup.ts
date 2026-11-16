import { test as setup } from '@playwright/test';
import { DEMO_DOCTOR, DEMO_PATIENT } from '../src/constants/demo-accounts';
import { api } from './support/api';
import { saveSession } from './support/auth';

setup('sign in the demo accounts', async () => {
  await saveSession('patient', await api.login(DEMO_PATIENT));
  await saveSession('doctor', await api.login(DEMO_DOCTOR));
});
