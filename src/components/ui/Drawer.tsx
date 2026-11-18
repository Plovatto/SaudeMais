import type { ReactNode, RefObject } from 'react';
import { Dialog } from './Dialog';
import { CloseButton } from './CloseButton';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  dismissible?: boolean;
  fallbackFocus?: RefObject<HTMLElement | null> | undefined;
  children?: ReactNode;
}

export function Drawer({ open, onClose, title, dismissible = true, fallbackFocus, children }: DrawerProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      placement="sheet"
      dismissible={dismissible}
      fallbackFocus={fallbackFocus}
      bare
    >
      <div className="flex min-h-full flex-col">
        <header className="border-border bg-surface sticky top-0 z-10 flex min-h-[61px] items-center gap-3 border-b px-5 py-3.5 max-sm:top-[30px]">
          <p aria-hidden className="text-text flex-1 text-[0.9375rem] font-semibold tracking-[-0.01em]">
            {title}
          </p>
          {dismissible && <CloseButton onClick={onClose} className="-me-2" />}
        </header>
        {children}
      </div>
    </Dialog>
  );
}

export function DrawerBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>;
}

export function DrawerFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-surface sticky bottom-0 flex justify-end gap-2.5 border-t px-5 py-3.5">
      {children}
    </div>
  );
}
