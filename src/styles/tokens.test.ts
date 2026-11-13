import { describe, expect, it } from 'vitest';
import css from './index.css?raw';

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Block not found: ${selector}`);
  const body = css.slice(start, css.indexOf('}', start));
  const entries = [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m): [string, string] => [
    m[1]!,
    m[2]!.trim(),
  ]);
  return Object.fromEntries(entries);
}

function luminance(hex: string): number {
  const channels = (hex.replace('#', '').match(/../g) ?? [])
    .map((part) => parseInt(part, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const LIGHT = ':root';
const DARK = ":root[data-theme='dark']";
const roleBlock = (theme: string, role: string) =>
  theme === LIGHT ? `[data-role='${role}']` : `${DARK} [data-role='${role}']`;
const roles = ['patient', 'doctor', 'admin'];

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
])('%s theme', (_name, theme) => {
  const base = { ...block(LIGHT), ...(theme === DARK ? block(DARK) : {}) };

  it.each(['text', 'text-secondary', 'text-muted', 'success-text', 'danger-text', 'warning-text'])(
    '%s reaches 4.5:1 on every background',
    (token) => {
      for (const background of ['canvas', 'surface', 'surface-muted']) {
        expect(contrast(base[token]!, base[background]!), `${token} on ${background}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    },
  );

  it.each(['success', 'danger', 'warning'])('%s text reaches 4.5:1 on its soft background', (status) => {
    expect(contrast(base[`${status}-text`]!, base[`${status}-soft`]!)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps field borders and the danger border visible (3:1)', () => {
    expect(contrast(base['border-strong']!, base['surface']!)).toBeGreaterThanOrEqual(3);
    expect(contrast(base['danger']!, base['surface']!)).toBeGreaterThanOrEqual(3);
  });

  describe.each(roles)('%s role', (role) => {
    const colors = {
      ...block(roleBlock(LIGHT, role)),
      ...(theme === DARK ? block(roleBlock(DARK, role)) : {}),
    };

    it('reaches 4.5:1 for text on the strong role color', () => {
      expect(contrast(colors['on-role']!, colors['role-strong']!)).toBeGreaterThanOrEqual(4.5);
    });

    it('reaches 4.5:1 for role-colored text on surfaces and on its soft background', () => {
      for (const background of [base['surface']!, base['canvas']!, colors['role-soft']!]) {
        expect(contrast(colors['role-text']!, background)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('keeps the focus ring visible against the page (3:1)', () => {
      expect(contrast(colors['role-strong']!, base['canvas']!)).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Figma colors', () => {
  it('keeps the original role colors for decorative surfaces', () => {
    expect(block("[data-role='patient']")['role']).toBe('#21bfc2');
    expect(block("[data-role='doctor']")['role']).toBe('#65a8f5');
    expect(block("[data-role='admin']")['role']).toBe('#909090');
  });

  it('replaces the default Tailwind palette, so only tokens can be used', () => {
    expect(css).toContain('--color-*: initial;');
  });
});
