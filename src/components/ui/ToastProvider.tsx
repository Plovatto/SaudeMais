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

const icons = { success: <LuCircleCheck />, danger: <LuCircleAlert />, info: <LuInfo /> };

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="rounded-tile bg-text text-surface shadow-card pointer-events-auto flex w-full max-w-sm items-center gap-3 py-1 ps-4 pe-1 text-sm font-medium">
      <IconSlot className="text-lg">{icons[toast.tone]}</IconSlot>
      <p className="flex-1 py-2">{toast.message}</p>
      <IconButton
        label="Fechar aviso"
        icon={<LuX />}
        onClick={() => onDismiss(toast.id)}
        className="text-surface enabled:hover:bg-surface/15 focus-visible:outline-surface"
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

  return (
    <ToastContext value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}
