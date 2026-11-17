import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';
import type { PasswordValues } from './profile-schemas';

export type ProfileBody = BodyOf<'/api/me', 'patch'>;
export type EmailPreference = ResponseOf<'/api/me/email-preferences', 'get'>[number];

export function updateProfile(body: ProfileBody) {
  return apiFetch('patch', '/api/me', { body });
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

export function endOtherSessions() {
  return apiFetch('delete', '/api/me/sessions/others');
}

export function endSession(id: string) {
  return apiFetch('delete', '/api/me/sessions/{id}', { params: { id } });
}

export function listEmailPreferences(signal: AbortSignal) {
  return apiFetch('get', '/api/me/email-preferences', { signal });
}

export function updateEmailPreference({ topic, enabled }: EmailPreference) {
  return apiFetch('patch', '/api/me/email-preferences', { body: { preferences: [{ topic, enabled }] } });
}
