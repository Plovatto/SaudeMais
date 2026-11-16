export const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]']);

const isLocalHttp = (url: URL) => url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);

export function buildCsp(apiUrl: string): string {
  const api = new URL(apiUrl);
  if (api.protocol !== 'https:' && !isLocalHttp(api)) {
    throw new Error('VITE_API_URL must use https in production builds, except on this machine');
  }
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
