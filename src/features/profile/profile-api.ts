import { apiFetch } from '@lib/api/api-fetch';
import { personalDataBody, type PersonalDataValues } from '@lib/validation/account-fields';
import type { PasswordValues } from './profile-schemas';

export function updateProfile(values: PersonalDataValues) {
  return apiFetch('patch', '/api/me', { body: personalDataBody(values) });
}

export function changePassword(body: PasswordValues) {
  return apiFetch('post', '/api/me/password', { body });
}

export function listSessions(signal: AbortSignal) {
  return apiFetch('get', '/api/me/sessions', { signal });
}

export function endAllSessions() {
  return apiFetch('delete', '/api/me/sessions');
}
