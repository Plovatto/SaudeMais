import { describe, expect, it } from 'vitest';
import { nextRange } from './schedule-schema';

const unit = { weekday: 1, openMin: 420, closeMin: 1140 };

describe('next range', () => {
  it('starts at the latest end of the day, not the last row', () => {
    const ranges = [
      { startMin: 780, endMin: 1020 },
      { startMin: 480, endMin: 720 },
    ];
    expect(nextRange(ranges, unit)).toEqual({ startMin: 1020, endMin: 1140 });
  });

  it('starts at the unit opening on an empty day', () => {
    expect(nextRange([], unit)).toEqual({ startMin: 420, endMin: 660 });
  });

  it('offers nothing at the unit closing time or when the unit is closed', () => {
    expect(nextRange([{ startMin: 480, endMin: 1140 }], unit)).toBeNull();
    expect(nextRange([], undefined)).toBeNull();
  });
});
