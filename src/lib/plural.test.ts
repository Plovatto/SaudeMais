import { describe, expect, it } from 'vitest';
import { plural, pluralWord } from './plural';

describe('plural', () => {
  it('uses the singular only for exactly one', () => {
    expect(plural(0, 'aparelho', 'aparelhos')).toBe('0 aparelhos');
    expect(plural(1, 'aparelho', 'aparelhos')).toBe('1 aparelho');
    expect(plural(2, 'aparelho', 'aparelhos')).toBe('2 aparelhos');
  });

  it('returns the word alone', () => {
    expect(pluralWord(1, 'nova', 'novas')).toBe('nova');
    expect(pluralWord(3, 'nova', 'novas')).toBe('novas');
  });
});
