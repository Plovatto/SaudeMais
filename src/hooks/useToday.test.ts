import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToday } from './useToday';

describe('useToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T02:59:30.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves to the next civil day in São Paulo once midnight passes', () => {
    const { result } = renderHook(() => useToday());
    expect(result.current).toBe('2026-11-19');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe('2026-11-20');
  });

  it('catches up as soon as the window gets focus again', () => {
    const { result } = renderHook(() => useToday());
    vi.setSystemTime(new Date('2026-11-21T15:00:00.000Z'));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current).toBe('2026-11-21');
  });

  it('keeps the same value inside one day', () => {
    const { result } = renderHook(() => useToday());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current).toBe('2026-11-19');
  });
});
