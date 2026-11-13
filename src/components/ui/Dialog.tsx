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
  closeLabel = 'Fechar',
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pressedBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onDialogClose = () => {
      returnFocus.current?.focus();
      returnFocus.current = null;
      onClose();
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
      className="rounded-card border-role bg-surface text-text shadow-card m-auto w-[calc(100%-2rem)] max-w-sm border p-0"
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
