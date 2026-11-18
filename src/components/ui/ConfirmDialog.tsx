import type { ReactNode, RefObject } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { cx } from '@lib/cx';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ReactNode;
  centered?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'danger' | 'primary';
  fallbackFocus?: RefObject<HTMLElement | null> | undefined;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  icon,
  centered = false,
  onConfirm,
  onClose,
  loading = false,
  disabled = false,
  tone = 'danger',
  fallbackFocus,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      centered={centered}
      fallbackFocus={fallbackFocus}
      dismissible={!loading}
    >
      <div className={cx(centered ? 'grid w-full grid-cols-2 gap-3' : 'flex flex-wrap justify-end gap-3')}>
        <Button variant="secondary" disabled={loading} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={tone} loading={loading} disabled={disabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
