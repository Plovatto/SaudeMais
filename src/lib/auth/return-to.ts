import { areas, type Role } from '@constants/areas';

const PUBLIC_ONLY = ['/login', '/cadastro'];

export function safeReturnTo(value: string | null): string | null {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return null;
  const path = value.split(/[?#]/)[0] ?? '';
  return PUBLIC_ONLY.includes(path) ? null : value;
}

export function homeFor(roles: readonly Role[], returnTo: string | null = null): string {
  const target = safeReturnTo(returnTo);
  if (target) return target;
  if (roles.length > 1) return '/perfis';
  return areas[roles[0] ?? 'patient'].base;
}
