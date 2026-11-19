import { useCallback, useEffect, useState } from 'react';

export function useCooldown(seconds: number) {
  const [clock, setClock] = useState({ until: 0, now: 0 });
  const remaining = Math.max(0, Math.ceil((clock.until - clock.now) / 1000));

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setClock((current) => ({ ...current, now: Date.now() })), 1000);
    return () => clearTimeout(timer);
  }, [remaining, clock]);

  const start = useCallback(() => {
    const now = Date.now();
    setClock({ until: now + seconds * 1000, now });
  }, [seconds]);

  return { remaining, start };
}
