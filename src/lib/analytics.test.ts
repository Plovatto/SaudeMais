import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLARITY_ID_FORMAT, GA_ID_FORMAT, validId } from '@config/analytics-ids';
import { track } from './analytics';
import {
  CONSENT_STORAGE_KEY,
  decideConsent,
  getConsent,
  reopenConsent,
  resetConsentForTests,
} from './consent';

afterEach(() => {
  localStorage.clear();
  resetConsentForTests();
});

describe('analytics ids', () => {
  it.each([
    ['G-ABC123XYZ', GA_ID_FORMAT, 'G-ABC123XYZ'],
    ['  G-ABC123  ', GA_ID_FORMAT, 'G-ABC123'],
    ['g-abc', GA_ID_FORMAT, null],
    ['', GA_ID_FORMAT, null],
    [undefined, GA_ID_FORMAT, null],
    ['abc123xyz9', CLARITY_ID_FORMAT, 'abc123xyz9'],
    ['abc 123', CLARITY_ID_FORMAT, null],
  ])('reads %j', (value, format, expected) => {
    expect(validId(value, format)).toBe(expected);
  });
});

describe('analytics events', () => {
  it('does nothing while the visitor has not agreed', () => {
    expect(() => track('login')).not.toThrow();
    expect(window.dataLayer ?? []).toHaveLength(0);
  });
});

describe('google analytics queue', () => {
  it('queues each command as an arguments object, the only shape gtag.js reads', async () => {
    vi.stubEnv('VITE_GA_ID', 'G-TEST123');
    vi.resetModules();
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    window.dataLayer = [];
    const analytics = await import('./analytics');

    analytics.startAnalytics(() => undefined);

    expect(window.dataLayer).not.toHaveLength(0);
    for (const entry of window.dataLayer) {
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
    }
    vi.unstubAllEnvs();
    delete window.dataLayer;
    delete window.gtag;
  });
});

describe('consent', () => {
  it('asks while there is no choice and remembers the answer', () => {
    expect(getConsent()).toMatchObject({ choice: null, asking: true });

    decideConsent('granted');

    expect(getConsent()).toMatchObject({ choice: 'granted', asking: false });
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted');
  });

  it('starts from the stored answer without asking again', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');

    expect(getConsent()).toMatchObject({ choice: 'denied', asking: false });
  });

  it('asks again when the visitor wants to change the choice', () => {
    decideConsent('denied');

    reopenConsent();

    expect(getConsent()).toMatchObject({ choice: 'denied', asking: true, requests: 1 });
  });

  it('keeps working when the browser refuses to store the choice', () => {
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      decideConsent('granted');
      expect(getConsent()).toMatchObject({ choice: 'granted', asking: false });
    } finally {
      blocked.mockRestore();
    }
  });
});
