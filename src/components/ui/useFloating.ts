import { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useDismiss, type DismissReason } from '@hooks/useDismiss';

export type FloatingSide = 'top' | 'bottom';

const VIEWPORT_GAP = 12;

export function useFloating() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentId = useId();

  const dismiss = useCallback((reason: DismissReason = 'escape') => {
    setOpen(false);
    if (reason === 'escape') triggerRef.current?.focus();
  }, []);

  useDismiss(rootRef, open, dismiss);

  const [side, setSide] = useState<FloatingSide>('bottom');
  const [room, setRoom] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const root = rootRef.current;
      const panel = document.getElementById(contentId);
      if (!root || !panel) return;
      const box = root.getBoundingClientRect();
      const below = window.innerHeight - box.bottom - VIEWPORT_GAP;
      const above = box.top - VIEWPORT_GAP;
      const next = panel.scrollHeight > below && above > below ? 'top' : 'bottom';
      setSide(next);
      setRoom(Math.max(0, Math.floor(next === 'top' ? above : below)));
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, contentId]);

  const placement = {
    side,
    style: (room === undefined ? {} : { '--floating-room': `${room}px` }) as CSSProperties,
  };

  const triggerProps = {
    ref: triggerRef,
    'aria-expanded': open,
    'aria-controls': open ? contentId : undefined,
  };

  return { open, setOpen, dismiss, rootRef, contentId, triggerProps, placement };
}
