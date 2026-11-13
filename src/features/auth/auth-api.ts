import { apiFetch } from '@lib/api/api-fetch';
import type { ForgotPasswordValues, LoginValues, RegisterValues, ResetPasswordValues } from './auth-schemas';

export function login(values: LoginValues) {
  return apiFetch('post', '/api/users/login', { body: values });
}

export function register({ fullName, email, phone, password, passwordConfirmation }: RegisterValues) {
  return apiFetch('post', '/api/users/register', {
    body: { fullName, email, phone, password, passwordConfirmation, acceptTerms: true },
  });
}

export function requestPasswordReset(body: ForgotPasswordValues) {
  return apiFetch('post', '/api/password-reset/request', { body });
}

export function confirmPasswordReset(token: string, values: ResetPasswordValues) {
  return apiFetch('post', '/api/password-reset/confirm', { body: { token, ...values } });
}
