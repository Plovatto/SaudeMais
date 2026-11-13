import { describe, expect, it } from 'vitest';
import { formatDateTime } from './date';
import { describeUserAgent } from './user-agent';

describe('describeUserAgent', () => {
  it.each([
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
      'Chrome no Windows',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0',
      'Edge no Windows',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Safari/604.1',
      'Safari no iOS',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0; rv:140.0) Gecko/20100101 Firefox/140.0',
      'Firefox no macOS',
    ],
    [
      'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
      'Chrome no Android',
    ],
    ['curl/8.10', 'Dispositivo desconhecido'],
    [null, 'Dispositivo desconhecido'],
  ])('describes %s', (userAgent, expected) => {
    expect(describeUserAgent(userAgent)).toBe(expected);
  });
});

describe('formatDateTime', () => {
  it('shows the date and time in São Paulo', () => {
    expect(formatDateTime('2026-11-20T02:30:00.000Z')).toBe('19/11/2026, 23:30');
  });
});
