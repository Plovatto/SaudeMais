import { useLayoutEffect, useState, type RefObject } from 'react';

export type ScrollFade = 'start' | 'end' | 'both' | undefined;

const EDGE = 2;

export const scrollFadeClass =
  'data-[fade=end]:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] data-[fade=start]:[mask-image:linear-gradient(to_left,black_calc(100%-2.5rem),transparent)] data-[fade=both]:[mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]';

export function useScrollFade(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
  content?: unknown,
): ScrollFade {
  const [fade, setFade] = useState<ScrollFade>(undefined);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const measure = () => {
      const before = node.scrollLeft > EDGE;
      const after = node.scrollLeft + node.clientWidth < node.scrollWidth - EDGE;
      setFade(before && after ? 'both' : before ? 'start' : after ? 'end' : undefined);
    };
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(node);
    Array.from(node.children).forEach((child) => observer?.observe(child));
    return () => {
      node.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [ref, enabled, content]);

  return enabled ? fade : undefined;
}
