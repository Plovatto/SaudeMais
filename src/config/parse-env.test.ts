import { describe, expect, it } from 'vitest';
import { parseEnv } from './parse-env';

describe('parseEnv', () => {
  it('reads the API URL without a trailing slash', () => {
    expect(parseEnv({ VITE_API_URL: 'https://api.example.com/' })).toEqual({
      apiUrl: 'https://api.example.com',
      analytics: { ga: false, clarity: false },
    });
  });

  it('turns analytics on only for well-formed ids', () => {
    const api = 'https://api.example.com';

    expect(
      parseEnv({ VITE_API_URL: api, VITE_GA_ID: 'G-ABC123', VITE_CLARITY_ID: 'abc123xyz' }).analytics,
    ).toEqual({
      ga: true,
      clarity: true,
    });
    expect(parseEnv({ VITE_API_URL: api, VITE_GA_ID: 'UA-1', VITE_CLARITY_ID: 'a b' }).analytics).toEqual({
      ga: false,
      clarity: false,
    });
  });

  it('keeps a path prefix', () => {
    expect(parseEnv({ VITE_API_URL: 'https://example.com/saudemais' }).apiUrl).toBe(
      'https://example.com/saudemais',
    );
  });

  it.each([
    undefined,
    '',
    'not-a-url',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://api.example.com/?a=1',
    'https://api.example.com/#x',
  ])('rejects %s', (value) => {
    expect(() => parseEnv({ VITE_API_URL: value })).toThrow(/VITE_API_URL/);
  });
});
