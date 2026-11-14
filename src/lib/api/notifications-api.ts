import { apiFetch } from './api-fetch';

export const markNotificationRead = (id: string) =>
  apiFetch('post', '/api/notifications/{id}/read', { params: { id } });
