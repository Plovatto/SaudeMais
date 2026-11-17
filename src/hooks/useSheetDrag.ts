import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';

export const SHEET_QUERY = '(max-width: 639px)';
export const GRAB_SELECTOR = '[role="separator"][tabindex="0"]';

const GROW_THRESHOLD = 24;
const TAP_DISTANCE = 5;
const SNAP_RATIO = 0.35;

interface Limits {
  min: number;
  max: number;
}

interface Drag {
  startY: number;
  startHeight: number;
  height: number;
  over: number;
}

const expanded = (dialog: HTMLElement) => dialog.dataset.sheet === 'full';

function measure(dialog: HTMLDialogElement): Limits {
  dialog.dataset.sheet = 'min';
  dialog.style.height = '';
  const min = dialog.offsetHeight;
  dialog.dataset.sheet = 'full';
  const natural = dialog.offsetHeight;
  dialog.dataset.sheet = 'min';
  return { min, max: Math.max(min, Math.min(window.innerHeight * 0.92, 780, natural)) };
}

function leaveGrab(dialog: HTMLDialogElement) {
  const grab = dialog.querySelector<HTMLElement>(GRAB_SELECTOR);
  if (document.activeElement !== grab) return;
  const other = [...dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')].find(
    (item) => !item.hasAttribute('disabled'),
  );
  other?.focus();
}

export function useSheetDrag(dialogRef: RefObject<HTMLDialogElement | null>, active: boolean) {
  const limits = useRef<Limits>({ min: 0, max: 0 });
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;
    limits.current = measure(dialog);
    dialog.dataset.grow = String(limits.current.max - limits.current.min > GROW_THRESHOLD);
    leaveGrab(dialog);
    return () => {
      delete dialog.dataset.sheet;
      delete dialog.dataset.grow;
      delete dialog.dataset.dragging;
      dialog.style.height = '';
      dialog.style.transform = '';
    };
  }, [active, dialogRef]);

  const canGrow = (dialog: HTMLElement) => dialog.dataset.grow === 'true';

  const settle = (dialog: HTMLElement, full: boolean) => {
    if (!dialog.style.height) {
      dialog.style.height = `${dialog.offsetHeight}px`;
      dialog.getBoundingClientRect();
    }
    dialog.style.transform = '';
    dialog.dataset.sheet = full ? 'full' : 'min';
    dialog.style.height = `${full ? limits.current.max : limits.current.min}px`;
    dialog.querySelector(GRAB_SELECTOR)?.setAttribute('aria-valuenow', full ? '100' : '0');
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startHeight = dialog.getBoundingClientRect().height;
    drag.current = { startY: event.clientY, startHeight, height: startHeight, over: 0 };
    dialog.dataset.dragging = '';
    dialog.style.height = `${startHeight}px`;
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    const current = drag.current;
    if (!dialog || !current) return;
    const { min, max } = limits.current;
    const want = current.startHeight + current.startY - event.clientY;
    current.height = Math.max(min, Math.min(max, want));
    current.over = Math.max(0, min - want);
    dialog.style.height = `${current.height}px`;
    dialog.style.transform = current.over ? `translateY(${current.over}px)` : '';
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    const current = drag.current;
    drag.current = null;
    if (!dialog || !current) return;
    delete dialog.dataset.dragging;
    const { min, max } = limits.current;
    const tapped = Math.abs(event.clientY - current.startY) < TAP_DISTANCE;
    if (!tapped && current.over > Math.min(min * 0.3, 160)) {
      dialog.close();
      return;
    }
    const full =
      canGrow(dialog) && (tapped ? !expanded(dialog) : current.height > min + (max - min) * SNAP_RATIO);
    settle(dialog, full);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (event.key === 'ArrowUp') {
      if (canGrow(dialog)) settle(dialog, true);
    } else if (expanded(dialog)) settle(dialog, false);
    else dialog.close();
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown };
}
