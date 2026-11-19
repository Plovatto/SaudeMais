export const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]']);

const isLocalHttp = (url: URL) => url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);

export interface CspAnalytics {
  ga: boolean;
  clarity: boolean;
}

const GA_SCRIPT = ['https://www.googletagmanager.com'];
const GA_CONNECT = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://www.googletagmanager.com',
];
const GA_IMG = ['https://www.google-analytics.com', 'https://www.googletagmanager.com'];
const CLARITY_SCRIPT = ['https://www.clarity.ms', 'https://scripts.clarity.ms'];
const CLARITY_CONNECT = ['https://*.clarity.ms', 'https://c.bing.com'];

export function buildCsp(apiUrl: string, analytics: CspAnalytics = { ga: false, clarity: false }): string {
  const api = new URL(apiUrl);
  if (api.protocol !== 'https:' && !isLocalHttp(api)) {
    throw new Error('VITE_API_URL must use https in production builds, except on this machine');
  }
  const scripts = [
    "'self'",
    ...(analytics.ga ? GA_SCRIPT : []),
    ...(analytics.clarity ? CLARITY_SCRIPT : []),
  ];
  const connections = [
    api.origin,
    ...(analytics.ga ? GA_CONNECT : []),
    ...(analytics.clarity ? CLARITY_CONNECT : []),
  ];
  const images = [
    "'self'",
    'data:',
    ...(analytics.ga ? GA_IMG : []),
    ...(analytics.clarity ? CLARITY_CONNECT : []),
  ];
  return [
    "default-src 'none'",
    `script-src ${scripts.join(' ')}`,
    "style-src 'self'",
    "font-src 'self'",
    `img-src ${images.join(' ')}`,
    `connect-src ${connections.join(' ')}`,
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
