import { describe, expect, it } from 'vitest';
import { buildCsp } from './csp';

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split(';').map((part): [string, string[]] => {
      const [name = '', ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );
}

describe('buildCsp', () => {
  const policy = directives(buildCsp('https://api.example.com'));

  it('only lets the page talk to the API origin', () => {
    expect(policy.get('connect-src')).toEqual(['https://api.example.com']);
  });

  it('blocks everything that is not explicitly allowed', () => {
    expect(policy.get('default-src')).toEqual(["'none'"]);
    expect(policy.get('object-src')).toEqual(["'none'"]);
  });

  it('loads scripts, styles and fonts only from the site itself, without inline code', () => {
    for (const directive of ['script-src', 'style-src', 'font-src']) {
      expect(policy.get(directive), directive).toEqual(["'self'"]);
    }
  });

  it('allows the analytics hosts only for the tools that are configured', () => {
    const none = directives(buildCsp('https://api.example.com', { ga: false, clarity: false }));
    const both = directives(buildCsp('https://api.example.com', { ga: true, clarity: true }));
    const onlyGa = directives(buildCsp('https://api.example.com', { ga: true, clarity: false }));

    expect(none.get('script-src')).toEqual(["'self'"]);
    expect(onlyGa.get('script-src')).toEqual(["'self'", 'https://www.googletagmanager.com']);
    expect(onlyGa.get('connect-src')).not.toContain('https://*.clarity.ms');
    expect(both.get('script-src')).toContain('https://www.clarity.ms');
    expect(both.get('connect-src')).toContain('https://*.clarity.ms');
    expect(both.get('connect-src')?.[0]).toBe('https://api.example.com');
  });

  it('restricts base URL and form targets to the site', () => {
    expect(policy.get('base-uri')).toEqual(["'self'"]);
    expect(policy.get('form-action')).toEqual(["'self'"]);
  });

  it('refuses an API without https, which the browser would block as mixed content', () => {
    expect(() => buildCsp('http://api.example.com')).toThrow(/https/);
  });

  it('accepts http only for an API on this machine, as in the end-to-end runs', () => {
    for (const url of ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://[::1]:3001']) {
      expect(directives(buildCsp(url)).get('connect-src'), url).toEqual([new URL(url).origin]);
    }
    for (const url of [
      'http://localhost.example.com',
      'http://127.0.0.1.nip.io',
      'http://localhost.',
      'http://127.0.0.2',
      'ftp://localhost',
    ]) {
      expect(() => buildCsp(url), url).toThrow(/https/);
    }
  });

  it('keeps only the origin when the API URL has a path', () => {
    expect(directives(buildCsp('https://api.example.com/v1')).get('connect-src')).toEqual([
      'https://api.example.com',
    ]);
  });
});
