import { useCallback, useId, useRef, useState } from 'react';
import { useDismiss, type DismissReason } from '@hooks/useDismiss';

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

  const triggerProps = {
    ref: triggerRef,
    'aria-expanded': open,
    'aria-controls': open ? contentId : undefined,
  };

  return { open, setOpen, dismiss, rootRef, contentId, triggerProps };
}
