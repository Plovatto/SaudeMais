import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { motionAllowed } from '@lib/motion';
import { CloseButton } from './CloseButton';
import { ToastContext, type ToastInput, type ToastTone } from './toast-context';

export const TOAST_DURATION_MS = 5000;
export const TOAST_EXIT_MS = 200;
const MAX_TRANSIENT_TOASTS = 3;

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  leaving?: boolean;
}

const tones = {
  success: {
    icon: <LuCircleCheck />,
    prefix: 'Sucesso: ',
    title: 'Tudo certo',
    card: 'border-success/35',
    accent: 'bg-success',
    badge: 'bg-success text-on-success shadow-[0_10px_18px_-8px_var(--success)]',
    track: 'bg-success/15',
  },
  danger: {
    icon: <LuCircleAlert />,
    prefix: 'Erro: ',
    title: 'Algo deu errado',
    card: 'border-danger/40',
    accent: 'bg-danger',
    badge: 'bg-danger text-on-danger shadow-[0_10px_18px_-8px_var(--danger)]',
    track: 'bg-danger/15',
  },
  info: {
    icon: <LuInfo />,
    prefix: 'Aviso: ',
    title: 'Aviso',
    card: 'border-role-strong/35',
    accent: 'bg-role-strong',
    badge: 'bg-role-strong text-on-role shadow-[0_10px_18px_-8px_var(--role-strong)]',
    track: 'bg-role-strong/15',
  },
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
  const returnFocus = useRef<HTMLElement | null>(null);
  const paused = hovered || focused || toast.tone === 'danger';
  const look = tones[toast.tone];

  useEffect(() => {
    if (paused || toast.leaving) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, toast.leaving, toast.id, onDismiss]);

  useEffect(() => {
    if (!toast.leaving) return;
    const timer = setTimeout(() => onRemove(toast.id), TOAST_EXIT_MS);
    return () => clearTimeout(timer);
  }, [toast.leaving, toast.id, onRemove]);

  const close = () => {
    const target = returnFocus.current?.isConnected
      ? returnFocus.current
      : document.querySelector<HTMLElement>('main');
    target?.focus();
    onDismiss(toast.id);
  };

  return (
    <div
      inert={toast.leaving}
      onAnimationEnd={(event) => {
        if (toast.leaving && event.target === event.currentTarget) onRemove(toast.id);
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => {
        setFocused(true);
        const from = event.relatedTarget;
        if (from instanceof HTMLElement && !event.currentTarget.contains(from)) returnFocus.current = from;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className={cx(
        'bg-surface text-text shadow-overlay relative flex w-full max-w-[400px] items-center gap-3.5 overflow-hidden rounded-[18px] border py-4 ps-5 pe-2.5',
        look.card,
        toast.leaving
          ? 'animate-fade-out'
          : 'motion-safe:animate-toast-in lg:motion-safe:animate-toast-in-up pointer-events-auto',
      )}
    >
      <span aria-hidden className={cx('absolute inset-y-0 start-0 w-1.5', look.accent)} />
      <span
        aria-hidden
        className={cx('grid size-11 shrink-0 place-items-center rounded-[14px] text-[1.375rem]', look.badge)}
      >
        {look.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span aria-hidden className="text-[0.9375rem] leading-tight font-bold tracking-[-0.01em]">
          {look.title}
        </span>
        <span className="text-text-secondary text-sm leading-snug font-medium">
          <span className="sr-only">{look.prefix}</span>
          {toast.message}
        </span>
      </span>
      <CloseButton label="Fechar aviso" onClick={close} className="shrink-0" />
      {toast.tone !== 'danger' && (
        <span aria-hidden className={cx('absolute inset-x-0 bottom-0 h-1', look.track)}>
          <span
            style={{
              animationDuration: `${TOAST_DURATION_MS}ms`,
              animationPlayState: paused || toast.leaving ? 'paused' : 'running',
            }}
            className={cx('motion-safe:animate-toast-timer block h-full origin-left', look.accent)}
          />
        </span>
      )}
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
      <div className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-[110] flex flex-col items-center gap-3 ps-[max(0.75rem,env(safe-area-inset-left))] pe-[max(0.75rem,env(safe-area-inset-right))] lg:inset-x-auto lg:end-[calc(2rem+env(safe-area-inset-right))] lg:top-auto lg:bottom-[calc(2rem+env(safe-area-inset-bottom))] lg:w-[400px] lg:items-end lg:ps-0 lg:pe-0">
        {regions.map(({ role, items }) => (
          <div
            key={role}
            role={role}
            aria-atomic="false"
            className="flex w-full flex-col items-center gap-3 lg:items-end"
          >
            {items.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} onRemove={remove} />
            ))}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
