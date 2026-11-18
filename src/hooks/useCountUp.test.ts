import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOTION_QUERY } from '@lib/motion';
import { stubMatchMedia } from '@/test/match-media';
import { COUNT_UP_MS, useCountUp } from './useCountUp';

describe('useCountUp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the final value right away when motion is reduced', () => {
    stubMatchMedia((query) => query !== MOTION_QUERY);
    const { result } = renderHook(() => useCountUp(128));
    expect(result.current).toBe(128);
  });

  it('shows the final value right away when media queries are unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useCountUp(42));
    expect(result.current).toBe(42);
  });

  it('counts up from zero in whole steps and lands on the target', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    stubMatchMedia((query) => query === MOTION_QUERY);
    const { result } = renderHook(() => useCountUp(200));
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(COUNT_UP_MS / 2);
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(200);
    expect(Number.isInteger(result.current)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(COUNT_UP_MS);
    });
    expect(result.current).toBe(200);
  });

  it('jumps to a new target once the first count is done', () => {
    stubMatchMedia(() => false);
    const { result, rerender } = renderHook(({ target }) => useCountUp(target), {
      initialProps: { target: 0.5 },
    });
    rerender({ target: 0.75 });
    expect(result.current).toBe(0.75);
  });
});
