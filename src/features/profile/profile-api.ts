import { apiFetch } from '@lib/api/api-fetch';
import type { PasswordValues, ProfileValues } from './profile-schemas';

export function updateProfile({ fullName, phone }: ProfileValues) {
  return apiFetch('patch', '/api/me', { body: { fullName, phone: phone === '' ? null : phone } });
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
