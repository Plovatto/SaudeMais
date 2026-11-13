export function buildCsp(apiUrl: string): string {
  const api = new URL(apiUrl);
  if (api.protocol !== 'https:') throw new Error('VITE_API_URL must use https in production builds');
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data:",
    `connect-src ${api.origin}`,
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
