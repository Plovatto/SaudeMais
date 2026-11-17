import type { ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import { Dialog } from './Dialog';
import { IconButton } from './IconButton';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} placement="drawer" bare>
      <div className="flex min-h-full flex-col">
        <header className="border-border bg-surface sticky top-0 z-10 flex min-h-[61px] items-center gap-3 border-b px-5 py-3.5">
          <p aria-hidden className="text-text flex-1 text-[0.9375rem] font-semibold tracking-[-0.01em]">
            {title}
          </p>
          <IconButton label="Fechar" icon={<LuX />} onClick={onClose} className="-me-2" />
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
