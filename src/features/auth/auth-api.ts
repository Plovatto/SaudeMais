import { apiFetch } from '@lib/api/api-fetch';
import type { LoginValues, RegisterValues } from './auth-schemas';

export function login(values: LoginValues) {
  return apiFetch('post', '/api/users/login', { body: values });
}

export function register({ fullName, email, phone, password, passwordConfirmation }: RegisterValues) {
  return apiFetch('post', '/api/users/register', {
    body: { fullName, email, phone, password, passwordConfirmation, acceptTerms: true },
  });
}
