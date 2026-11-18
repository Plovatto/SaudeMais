import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { motionAllowed } from '@lib/motion';
import { CloseButton } from './CloseButton';
import { IconSlot } from './IconSlot';
import { ToastContext, type ToastInput, type ToastTone } from './toast-context';

export const TOAST_DURATION_MS = 5000;
const MAX_TRANSIENT_TOASTS = 3;

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  leaving?: boolean;
}

const tones = {
  success: { icon: <LuCircleCheck />, prefix: 'Sucesso: ' },
  danger: { icon: <LuCircleAlert />, prefix: 'Erro: ' },
  info: { icon: <LuInfo />, prefix: 'Aviso: ' },
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
  onRemove: (id: number) => void;
}

function Toast({ toast, onDismiss, onRemove }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(TOAST_DURATION_MS);
  const paused = hovered || focused || toast.tone === 'danger';

  useEffect(() => {
    if (paused || toast.leaving) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, toast.leaving, toast.id, onDismiss]);

  return (
    <div
      aria-hidden={toast.leaving}
      onAnimationEnd={(event) => {
        if (toast.leaving && event.target === event.currentTarget) onRemove(toast.id);
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className={cx(
        'bg-text text-surface shadow-overlay flex w-full max-w-sm items-center gap-3 rounded-[14px] py-1 ps-3 pe-1 text-[0.8125rem] font-medium',
        toast.leaving
          ? 'animate-fade-out pointer-events-none'
          : 'motion-safe:animate-rise pointer-events-auto',
      )}
    >
      <IconSlot className="bg-surface/12 size-8 justify-center rounded-[9px] text-base">
        {tones[toast.tone].icon}
      </IconSlot>
      <p className="flex-1 py-2">
        <span className="sr-only">{tones[toast.tone].prefix}</span>
        {toast.message}
      </p>
      <CloseButton
        label="Fechar aviso"
        onClick={() => onDismiss(toast.id)}
        className="text-surface can-hover:bg-surface/15 focus-visible:outline-surface focus-visible:-outline-offset-2"
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      if (!motionAllowed()) return remove(id);
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    },
    [remove],
  );

  const show = useCallback(({ message, tone = 'info' }: ToastInput) => {
    nextId.current += 1;
    const toast = { id: nextId.current, message, tone };
    setToasts((current) => {
      const next = [...current, toast];
      const transient = (item: ToastItem) => item.tone !== 'danger' && !item.leaving;
      const excess = next.filter(transient).length - MAX_TRANSIENT_TOASTS;
      let dropped = 0;
      return next.filter((item) => !transient(item) || dropped++ >= excess);
    });
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  const regions = [
    { role: 'alert', items: toasts.filter((toast) => toast.tone === 'danger') },
    { role: 'status', items: toasts.filter((toast) => toast.tone !== 'danger') },
  ] as const;

  return (
    <ToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {regions.map(({ role, items }) => (
          <div key={role} role={role} aria-atomic="false" className="flex w-full flex-col items-center gap-2">
            {items.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} onRemove={remove} />
            ))}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
