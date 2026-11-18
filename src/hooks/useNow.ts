import { useEffect, useState } from 'react';
import { MINUTE_MS } from '@lib/date';

export function useNow(intervalMs = MINUTE_MS): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
