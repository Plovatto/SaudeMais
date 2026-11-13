import { describe, expect, it } from 'vitest';
import { fromMinutes, isTimeOfDay, toMinutes } from './time-of-day';

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
});
