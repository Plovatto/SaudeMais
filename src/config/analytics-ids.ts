export const GA_ID_FORMAT = /^G-[A-Z0-9]+$/;

export const CLARITY_ID_FORMAT = /^[a-z0-9]+$/i;

export function validId(value: unknown, format: RegExp): string | null {
  const id = typeof value === 'string' ? value.trim() : '';
  return id && format.test(id) ? id : null;
}
