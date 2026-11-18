import { useEffect, useState } from 'react';
import { motionAllowed } from '@lib/motion';

export const COUNT_UP_MS = 500;

const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

export function useCountUp(target: number, duration = COUNT_UP_MS): number {
  const [animate] = useState(motionAllowed);
  const [progress, setProgress] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min((now - start) / duration, 1);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, duration]);

  if (progress >= 1) return target;
  const current = target * easeOut(progress);
  return Number.isInteger(target) ? Math.round(current) : current;
}
