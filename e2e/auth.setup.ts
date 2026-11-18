import { test as setup } from '@playwright/test';
import { EXAMPLE_DOCTOR, EXAMPLE_PATIENT } from '../src/constants/example-accounts';
import { api } from './support/api';
import { saveSession } from './support/auth';

setup('sign in the example accounts', async () => {
  await saveSession('patient', await api.login(EXAMPLE_PATIENT));
  await saveSession('doctor', await api.login(EXAMPLE_DOCTOR));
});
