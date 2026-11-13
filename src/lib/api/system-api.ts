import { apiFetch } from './api-fetch';

export const getHealth = (signal?: AbortSignal) => apiFetch('get', '/health', signal ? { signal } : {});
