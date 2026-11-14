import { describe, expect, it } from 'vitest';
import { formatTimeInput, formatTimeRange, fromMinutes, isTimeOfDay, toMinutes } from './time-of-day';

describe('time of day', () => {
  it.each([
    ['08:00', 480],
    ['00:00', 0],
    ['23:59', 1439],
    ['24:00', 1440],
  ])('reads %s as %i minutes and back', (text, minutes) => {
    expect(toMinutes(text)).toBe(minutes);
    expect(fromMinutes(minutes)).toBe(text);
  });

  it.each(['8:00', '24:01', '12:60', 'meio-dia', ''])('rejects %s', (text) => {
    expect(isTimeOfDay(text)).toBe(false);
    expect(toMinutes(text)).toBeNaN();
  });

  it.each([
    ['0', '0'],
    ['073', '07:3'],
    ['0730', '07:30'],
    ['07:30', '07:30'],
    ['8:', '8:'],
    ['2400', '24:00'],
    ['12a3x4', '12:34'],
    ['123456', '12:34'],
  ])('formats %s while typing as %s', (typed, shown) => {
    expect(formatTimeInput(typed)).toBe(shown);
  });

  it('formats a range of minutes', () => {
    expect(formatTimeRange(480, 1440)).toBe('08:00–24:00');
  });
});
