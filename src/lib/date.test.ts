import { describe, expect, it } from 'vitest';
import { formatDateTime } from './date';

describe('formatDateTime', () => {
  it('shows the date and time in São Paulo', () => {
    expect(formatDateTime('2026-11-20T02:30:00.000Z')).toBe('19/11/2026, 23:30');
  });

  it('does not break on an invalid date', () => {
    expect(formatDateTime('not-a-date')).toBe('data indisponível');
  });
});
