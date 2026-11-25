import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '@lib/cx';
import { motionAllowed } from '@lib/motion';

const FOLD = 0.7;

export function Reveal({
  show,
  className,
  children,
}: {
  show: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shownAtStart = useRef(show);

  useEffect(() => {
    if (!show) {
      shownAtStart.current = false;
      return;
    }
    const node = ref.current;
    if (shownAtStart.current || !node) return;
    if (node.getBoundingClientRect().top > window.innerHeight * FOLD) {
      node.scrollIntoView?.({ block: 'start', behavior: motionAllowed() ? 'smooth' : 'auto' });
    }
  }, [show]);

  if (!show) return null;
  return (
    <div ref={ref} className={cx('motion-safe:animate-unfold scroll-mt-4', className)}>
      {children}
    </div>
  );
}
