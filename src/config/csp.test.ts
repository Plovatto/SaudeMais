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

  it('restricts base URL and form targets to the site', () => {
    expect(policy.get('base-uri')).toEqual(["'self'"]);
    expect(policy.get('form-action')).toEqual(["'self'"]);
  });

  it('keeps only the origin when the API URL has a path', () => {
    expect(directives(buildCsp('https://api.example.com/v1')).get('connect-src')).toEqual([
      'https://api.example.com',
    ]);
  });
});
