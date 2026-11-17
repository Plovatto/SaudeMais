import { useEffect, useEffectEvent, useId, useRef, type ReactNode, type RefObject } from 'react';
import { LuX } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { IconButton } from './IconButton';
import { IconSlot } from './IconSlot';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: 'role' | 'danger';
  bare?: boolean;
  centered?: boolean;
  placement?: 'center' | 'side' | 'sheet' | 'drawer';
  closeLabel?: string;
  dismissible?: boolean;
  fallbackFocus?: RefObject<HTMLElement | null> | undefined;
  initialFocus?: RefObject<HTMLElement | null>;
  children?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  tone = 'role',
  bare = false,
  centered = false,
  placement = 'center',
  closeLabel = 'Fechar',
  dismissible = true,
  fallbackFocus,
  initialFocus,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pressedBackdrop = useRef(false);
  const closingFromProp = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      initialFocus?.current?.focus();
    } else if (!open && dialog.open) {
      closingFromProp.current = true;
      dialog.close();
    }
  }, [open, initialFocus]);

  const onDialogClose = useEffectEvent(() => {
    if (!dismissible && !closingFromProp.current) {
      ref.current?.showModal();
      return;
    }
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
    else fallbackFocus?.current?.focus();
    returnFocus.current = null;
    if (closingFromProp.current) closingFromProp.current = false;
    else onClose();
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const listener = () => onDialogClose();
    dialog.addEventListener('close', listener);
    return () => dialog.removeEventListener('close', listener);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (dismissible && pressedBackdrop.current && event.target === event.currentTarget)
          ref.current?.close();
      }}
      className={cx(
        'border-border bg-surface text-text shadow-overlay backdrop:motion-safe:animate-fade motion-safe:animate-pop m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-[20px] border p-0',
        (placement === 'side' || placement === 'drawer') &&
          'lg:motion-safe:animate-slide max-w-lg lg:me-0 lg:h-dvh lg:max-h-dvh lg:w-full lg:rounded-e-none lg:border-y-0 lg:border-e-0',
        (placement === 'sheet' || placement === 'drawer') &&
          'max-sm:rounded-t-sheet max-sm:motion-safe:animate-sheet max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-[env(safe-area-inset-bottom)] sm:max-w-md',
      )}
    >
      {bare ? (
        <>
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
          {children}
        </>
      ) : (
        <div className={cx('relative flex flex-col gap-4 p-6 pt-8', centered && 'items-center text-center')}>
          {dismissible && (
            <IconButton
              label={closeLabel}
              icon={<LuX />}
              onClick={() => ref.current?.close()}
              className="absolute end-2 top-2"
            />
          )}
          {icon && (
            <IconSlot
              className={cx(
                'size-12 justify-center rounded-full text-[22px]',
                tone === 'danger' ? 'bg-danger-soft text-danger-text' : 'bg-role-soft text-role-text',
              )}
            >
              {icon}
            </IconSlot>
          )}
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="text-text-secondary text-sm">
                {description}
              </div>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
