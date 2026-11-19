import { useId } from 'react';
import { cx } from '@lib/cx';

const PULSE_PATH = 'M0 32H96l10-7 10 7h20l8-26 14 52 12-40 8 14h24l10-8 10 8h20l10-8 10 8H400';

export function PulseLine({ className }: { className?: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 400 64" fill="none" aria-hidden className={cx('h-auto overflow-visible', className)}>
      <defs>
        <linearGradient id={gradient} x1="0" x2="400" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={PULSE_PATH}
        stroke={`url(#${gradient})`}
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={PULSE_PATH}
        pathLength="1"
        stroke={`url(#${gradient})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        className="motion-safe:animate-ecg drop-shadow-[0_0_6px_rgb(255_255_255/0.6)]"
      />
    </svg>
  );
}
