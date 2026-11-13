import { useEffect, useId, useRef, type ReactNode } from 'react';
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
  centered?: boolean;
  placement?: 'center' | 'side';
  closeLabel?: string;
  children?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  centered = false,
  placement = 'center',
  closeLabel = 'Fechar',
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
    } else if (!open && dialog.open) {
      closingFromProp.current = true;
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onDialogClose = () => {
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
      returnFocus.current = null;
      if (closingFromProp.current) closingFromProp.current = false;
      else onClose();
    };
    dialog.addEventListener('close', onDialogClose);
    return () => dialog.removeEventListener('close', onDialogClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) ref.current?.close();
      }}
      className={cx(
        'rounded-card border-role bg-surface text-text shadow-card m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto border p-0',
        placement === 'side' &&
          'lg:rounded-s-card max-w-lg lg:me-0 lg:h-dvh lg:max-h-dvh lg:w-full lg:rounded-none lg:border-y-0 lg:border-e-0',
      )}
    >
      <div className={cx('relative flex flex-col gap-4 p-6 pt-8', centered && 'items-center text-center')}>
        <IconButton
          label={closeLabel}
          icon={<LuX />}
          onClick={() => ref.current?.close()}
          className="absolute end-2 top-2"
        />
        {icon && <IconSlot badge="strong">{icon}</IconSlot>}
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
    </dialog>
  );
}
