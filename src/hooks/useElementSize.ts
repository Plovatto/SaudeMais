import { useCallback, useLayoutEffect, useState } from 'react';

type Size = { width: number; height: number };

export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const ref = useCallback((next: T | null) => setNode(next), []);

  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => setSize({ width: node.offsetWidth, height: node.offsetHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [ref, node ? size : null] as const;
}
