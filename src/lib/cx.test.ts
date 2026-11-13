import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('drops empty values', () => {
    expect(cx('flex', false, null, undefined, 'gap-2')).toBe('flex gap-2');
  });

  it('lets later classes override conflicting ones, including project tokens', () => {
    expect(
      cx('text-text-secondary rounded-field shadow-card', 'text-surface rounded-full shadow-button'),
    ).toBe('text-surface rounded-full shadow-button');
  });

  it('keeps font size and color apart', () => {
    expect(cx('text-sm', 'text-role-text')).toBe('text-sm text-role-text');
  });
});
