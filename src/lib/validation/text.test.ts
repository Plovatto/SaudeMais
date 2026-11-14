import { describe, expect, it } from 'vitest';
import { boundedText, FREE_TEXT_MAX, freeText } from './text';

describe('freeText', () => {
  it('accepts multi-line text with tabs and trims the ends', () => {
    expect(freeText().parse('  Linha 1\nLinha 2\r\n\tFim  ')).toBe('Linha 1\nLinha 2\r\n\tFim');
    expect(freeText().parse('')).toBe('');
  });

  it('rejects other control characters', () => {
    expect(freeText().safeParse('texto\u0000').success).toBe(false);
    expect(freeText().safeParse('a\u0007b').success).toBe(false);
    expect(freeText().safeParse('a\u007fb').success).toBe(false);
  });

  it('counts code points against the limit', () => {
    expect(freeText().safeParse('😀'.repeat(FREE_TEXT_MAX)).success).toBe(true);
    expect(freeText().safeParse('a'.repeat(FREE_TEXT_MAX + 1)).error?.issues[0]?.message).toBe(
      `Use até ${FREE_TEXT_MAX} caracteres.`,
    );
  });
});

describe('boundedText', () => {
  it('keeps rejecting line breaks in single-line fields', () => {
    expect(boundedText(1, 10, 'x').safeParse('a\nb').error?.issues[0]?.message).toBe(
      'O texto não pode ter caracteres de controle.',
    );
  });
});
