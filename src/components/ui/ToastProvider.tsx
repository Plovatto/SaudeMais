import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu';
import { IconButton } from './IconButton';
import { IconSlot } from './IconSlot';
import { ToastContext, type ToastInput, type ToastTone } from './toast-context';

export const TOAST_DURATION_MS = 5000;

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const tones = {
  success: { icon: <LuCircleCheck />, prefix: 'Sucesso: ' },
  danger: { icon: <LuCircleAlert />, prefix: 'Erro: ' },
  info: { icon: <LuInfo />, prefix: 'Aviso: ' },
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(TOAST_DURATION_MS);
  const paused = hovered || focused || toast.tone === 'danger';

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className="rounded-tile bg-text text-surface shadow-card pointer-events-auto flex w-full max-w-sm items-center gap-3 py-1 ps-4 pe-1 text-sm font-medium"
    >
      <IconSlot className="text-lg">{tones[toast.tone].icon}</IconSlot>
      <p className="flex-1 py-2">
        <span className="sr-only">{tones[toast.tone].prefix}</span>
        {toast.message}
      </p>
      <IconButton
        label="Fechar aviso"
        icon={<LuX />}
        onClick={() => onDismiss(toast.id)}
        className="text-surface can-hover:bg-surface/15 focus-visible:outline-surface focus-visible:-outline-offset-2"
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(({ message, tone = 'info' }: ToastInput) => {
    nextId.current += 1;
    const toast = { id: nextId.current, message, tone };
    setToasts((current) => [...current.slice(-2), toast]);
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  const regions = [
    { role: 'alert', items: toasts.filter((toast) => toast.tone === 'danger') },
    { role: 'status', items: toasts.filter((toast) => toast.tone !== 'danger') },
  ] as const;

  return (
    <ToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {regions.map(({ role, items }) => (
          <div key={role} role={role} aria-atomic="false" className="flex w-full flex-col items-center gap-2">
            {items.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
