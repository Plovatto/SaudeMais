import { describe, expect, it } from 'vitest';
import { formatPhone } from './phone';

describe('formatPhone', () => {
  it.each([
    ['+551133334444', '(11) 3333-4444'],
    ['+5511987654321', '(11) 98765-4321'],
    ['+14155550100', '+14155550100'],
    ['', ''],
  ])('shows %s as %s', (stored, shown) => {
    expect(formatPhone(stored)).toBe(shown);
  });
});
