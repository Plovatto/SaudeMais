import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';

export const SHEET_QUERY = '(width < 40rem)';

const GRAB_SELECTOR = '[role="separator"][tabindex="0"]';
const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea';
const GROW_THRESHOLD = 24;
const TAP_DISTANCE = 5;
const SNAP_RATIO = 0.35;

interface Limits {
  min: number;
  max: number;
}

interface Drag {
  pointerId: number;
  startY: number;
  startHeight: number;
  startFull: boolean;
  height: number;
  over: number;
  travel: number;
}

function measure(dialog: HTMLDialogElement, full: boolean): Limits {
  dialog.dataset.grow = 'true';
  dialog.style.height = '';
  dialog.dataset.sheet = 'min';
  const min = dialog.offsetHeight;
  dialog.dataset.sheet = 'full';
  const natural = dialog.offsetHeight;
  dialog.dataset.sheet = full ? 'full' : 'min';
  return { min, max: Math.max(min, Math.min(window.innerHeight * 0.92, 780, natural)) };
}

function isVisible(element: HTMLElement, root: HTMLElement): boolean {
  for (let node: HTMLElement | null = element; node && node !== root; node = node.parentElement) {
    if (node.hidden || getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

function leaveGrab(dialog: HTMLDialogElement) {
  if (document.activeElement !== dialog.querySelector(GRAB_SELECTOR)) return;
  [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
    .find((item) => !item.hasAttribute('disabled') && isVisible(item, dialog))
    ?.focus();
}

interface SheetDragOptions {
  dialogRef: RefObject<HTMLDialogElement | null>;
  active: boolean;
  dismissible: boolean;
}

export function useSheetDrag({ dialogRef, active, dismissible }: SheetDragOptions) {
  const [full, setFull] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [wasActive, setWasActive] = useState(active);
  const limits = useRef<Limits>({ min: 0, max: 0 });
  const drag = useRef<Drag | null>(null);

  if (wasActive !== active) {
    setWasActive(active);
    if (!active) {
      setFull(false);
      setDragging(false);
    }
  }

  const canGrow = () => limits.current.max - limits.current.min > GROW_THRESHOLD;

  const refresh = useEffectEvent(() => {
    const dialog = dialogRef.current;
    if (!dialog || drag.current) return;
    limits.current = measure(dialog, full);
    const grows = canGrow();
    const stillFull = full && grows;
    dialog.dataset.grow = String(grows);
    dialog.dataset.sheet = stillFull ? 'full' : 'min';
    dialog.style.height = stillFull ? `${limits.current.max}px` : '';
    if (full && !stillFull) setFull(false);
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;
    refresh();
    leaveGrab(dialog);
    const observer = new ResizeObserver(() => refresh());
    [...dialog.children].forEach((child) => {
      if (!child.matches(GRAB_SELECTOR)) observer.observe(child);
    });
    const onResize = () => refresh();
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      drag.current = null;
      delete dialog.dataset.grow;
      dialog.style.height = '';
      dialog.style.transform = '';
    };
  }, [active, dialogRef]);

  const settle = (dialog: HTMLElement, target: boolean) => {
    if (!dialog.style.height) {
      dialog.style.height = `${dialog.offsetHeight}px`;
      dialog.getBoundingClientRect();
    }
    dialog.style.transform = '';
    dialog.style.height = `${target ? limits.current.max : limits.current.min}px`;
    setFull(target);
  };

  const release = (event: PointerEvent<HTMLElement>) => {
    const grab = event.currentTarget;
    if (grab.hasPointerCapture(event.pointerId)) grab.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(false);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || drag.current || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startHeight = dialog.getBoundingClientRect().height;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight,
      startFull: full,
      height: startHeight,
      over: 0,
      travel: 0,
    };
    dialog.style.height = `${startHeight}px`;
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    const current = drag.current;
    if (!dialog || current?.pointerId !== event.pointerId) return;
    if (event.buttons === 0 || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const { min, max } = limits.current;
    const want = current.startHeight + current.startY - event.clientY;
    current.height = Math.max(min, Math.min(max, want));
    current.over = Math.max(0, min - want);
    current.travel = Math.max(current.travel, Math.abs(event.clientY - current.startY));
    dialog.style.height = `${current.height}px`;
    dialog.style.transform = current.over ? `translateY(${current.over}px)` : '';
    setFull(current.height > min);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    const current = drag.current;
    if (!dialog || current?.pointerId !== event.pointerId) return;
    release(event);
    const { min, max } = limits.current;
    const tapped = current.travel < TAP_DISTANCE;
    if (dismissible && !tapped && current.over > Math.min(min * 0.3, 160)) {
      dialog.close();
      return;
    }
    const target =
      canGrow() && (tapped ? !current.startFull : current.height > min + (max - min) * SNAP_RATIO);
    settle(dialog, target);
  };

  const onPointerCancel = (event: PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    const current = drag.current;
    if (!dialog || current?.pointerId !== event.pointerId) return;
    release(event);
    settle(dialog, current.startFull);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    if (event.key === 'ArrowUp') {
      if (canGrow()) settle(dialog, true);
    } else if (full) settle(dialog, false);
    else if (dismissible) dialog.close();
  };

  return {
    dialogProps: active
      ? { 'data-sheet': full ? 'full' : 'min', 'data-dragging': dragging ? '' : undefined }
      : {},
    grabProps: {
      'aria-valuenow': full ? 100 : 0,
      'aria-valuetext': full ? 'Expandido' : 'Recolhido',
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
    },
  };
}
