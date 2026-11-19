import { CLARITY_ID_FORMAT, GA_ID_FORMAT, validId } from '@config/analytics-ids';
import { getConsent, subscribeConsent } from './consent';

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ClarityFn;
  }
}

export type AnalyticsEvent = 'sign_up' | 'login' | 'password_reset_request';

const COOKIE_PREFIXES = ['_ga', '_gid', '_clck', '_clsk'];

const gaId = validId(import.meta.env.VITE_GA_ID, GA_ID_FORMAT);
const clarityId = validId(import.meta.env.VITE_CLARITY_ID, CLARITY_ID_FORMAT);

export const analyticsEnabled = Boolean(gaId ?? clarityId);

let loaded = false;
let granted = false;
let reloadPage = () => {
  location.reload();
};

function gtag(..._args: unknown[]): void {
  window.dataLayer?.push(arguments);
}

function injectScript(src: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function setGaDisabled(disabled: boolean): void {
  if (gaId) (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = disabled;
}

function setClarityConsent(allowed: boolean): void {
  window.clarity?.('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: allowed ? 'granted' : 'denied',
  });
}

function clearCookies(): void {
  const host = location.hostname;
  const domains = new Set(['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]);
  for (const entry of document.cookie.split(';')) {
    const name = (entry.split('=')[0] ?? '').trim();
    if (!COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

function load(): void {
  loaded = true;
  if (gaId) {
    gtag('js', new Date());
    gtag('config', gaId);
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
  }
  if (clarityId) {
    const queue: ClarityFn = (...args: unknown[]) => {
      (queue.q ??= []).push(args);
    };
    window.clarity ??= queue;
    injectScript(`https://www.clarity.ms/tag/${clarityId}`);
  }
}

function grant(): void {
  granted = true;
  setGaDisabled(false);
  gtag('consent', 'update', { analytics_storage: 'granted' });
  if (!loaded) load();
  setClarityConsent(true);
}

function revoke(): void {
  granted = false;
  setGaDisabled(true);
  gtag('consent', 'update', { analytics_storage: 'denied' });
  setClarityConsent(false);
  clearCookies();
  reloadPage();
}

function apply(): void {
  const allowed = getConsent().choice === 'granted';
  if (allowed && !granted) grant();
  else if (!allowed && granted) revoke();
}

export function startAnalytics(reload?: () => void): void {
  if (!analyticsEnabled) return;
  if (reload) reloadPage = reload;
  if (gaId) {
    window.dataLayer ??= [];
    window.gtag = gtag;
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  }
  if (getConsent().choice === 'denied') clearCookies();
  apply();
  subscribeConsent(apply);
}

export function track(event: AnalyticsEvent, params?: Record<string, string>): void {
  if (!granted) return;
  if (gaId) gtag('event', event, ...(params ? [params] : []));
  window.clarity?.('event', event);
}
