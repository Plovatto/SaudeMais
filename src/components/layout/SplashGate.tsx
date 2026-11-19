import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { cx } from '@lib/cx';
import { SplashScreen } from './SplashScreen';

const SHOW_MS = 3000;
const SHOW_REDUCED_MS = 1000;
const LEAVE_MS = 600;

type Phase = 'show' | 'leave' | 'done';

let seen = false;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SplashGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(seen ? 'done' : 'show');

  useLayoutEffect(() => {
    if (phase !== 'show') return;
    document.documentElement.dataset.splashing = '';
    return () => {
      delete document.documentElement.dataset.splashing;
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') return;
    const timer = setTimeout(
      () => {
        if (phase === 'show') seen = true;
        setPhase(phase === 'show' ? 'leave' : 'done');
      },
      phase === 'show' ? (reducedMotion() ? SHOW_REDUCED_MS : SHOW_MS) : LEAVE_MS,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <>
      <div inert={phase === 'show'} aria-hidden={phase === 'show' || undefined}>
        {children}
      </div>
      {phase !== 'done' && (
        <div
          data-splash-layer
          className={cx(
            'fixed inset-0 z-[100] transition-[opacity,scale] duration-[600ms] ease-out',
            phase === 'leave' && 'pointer-events-none scale-105 opacity-0',
          )}
        >
          <SplashScreen />
        </div>
      )}
    </>
  );
}
