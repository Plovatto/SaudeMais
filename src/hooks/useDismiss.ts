import { useEffect, type RefObject } from 'react';

export type DismissReason = 'outside' | 'escape';

function isInsideOtherDialog(target: Element, root: HTMLElement): boolean {
  const dialog = target.closest('dialog[open]');
  return dialog !== null && !dialog.contains(root);
}

export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: (reason: DismissReason) => void,
): void {
  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;
    const isOutside = (target: EventTarget | null) =>
      target instanceof Element && !root.contains(target) && !isInsideOtherDialog(target, root);
    const onPointerDown = (event: PointerEvent) => {
      if (isOutside(event.target)) onDismiss('outside');
    };
    const onFocusOut = (event: FocusEvent) => {
      if (isOutside(event.relatedTarget)) onDismiss('outside');
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (event.target instanceof Element && isInsideOtherDialog(event.target, root)) return;
      event.preventDefault();
      onDismiss('escape');
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('focusout', onFocusOut);
    };
  }, [ref, active, onDismiss]);
}
