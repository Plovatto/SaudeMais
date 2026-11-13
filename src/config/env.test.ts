import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('reads the API URL without a trailing slash', () => {
    expect(parseEnv({ VITE_API_URL: 'https://api.example.com/' })).toEqual({
      apiUrl: 'https://api.example.com',
    });
  });

  it('keeps a path prefix', () => {
    expect(parseEnv({ VITE_API_URL: 'https://example.com/saudemais' }).apiUrl).toBe(
      'https://example.com/saudemais',
    );
  });

  it.each([undefined, '', 'not-a-url', 'ftp://example.com', 'javascript:alert(1)'])('rejects %s', (value) => {
    expect(() => parseEnv({ VITE_API_URL: value })).toThrow(/VITE_API_URL/);
  });
});
