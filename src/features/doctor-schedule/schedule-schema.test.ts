import { describe, expect, it } from 'vitest';
import { dayMinutes, nextRange, toBody, weeklySlots } from './schedule-schema';

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

describe('weekly slots', () => {
  const morning = { isActive: true, ranges: [{ startMin: 480, endMin: 725 }] };
  const off = { isActive: false, ranges: [{ startMin: 480, endMin: 720 }] };
  const days = [morning, off, { isActive: true, ranges: [] }];

  it('counts whole appointments of the active days only', () => {
    expect(dayMinutes(morning)).toBe(245);
    expect(dayMinutes(off)).toBe(0);
    expect(weeklySlots({ days, appointmentDurationMin: 30 })).toBe(8);
    expect(weeklySlots({ days, appointmentDurationMin: 45 })).toBe(5);
  });
});

describe('schedule body', () => {
  const loaded = {
    appointmentDurationMin: 30,
    specialtyDurationMin: 30,
    isSpecialtyDefault: true,
    days: [],
    unitHours: [],
  };
  const values = (appointmentDurationMin: number) => ({ days: [], appointmentDurationMin });

  it('leaves the duration out while it is untouched', () => {
    expect(toBody(values(30), loaded)).toEqual({ days: [] });
    expect(toBody(values(45), { ...loaded, appointmentDurationMin: 45, isSpecialtyDefault: false })).toEqual({
      days: [],
    });
  });

  it('sends a new duration and null to return to the specialty default', () => {
    expect(toBody(values(20), loaded)).toEqual({ days: [], appointmentDurationMin: 20 });
    expect(toBody(values(30), { ...loaded, appointmentDurationMin: 45, isSpecialtyDefault: false })).toEqual({
      days: [],
      appointmentDurationMin: null,
    });
  });
});
