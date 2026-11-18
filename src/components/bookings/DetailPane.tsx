import type { ReactNode } from 'react';
import { Dialog } from '@components/ui';

interface DetailPaneProps {
  desktop: boolean;
  label: string;
  open: boolean;
  paneKey: string | undefined;
  showPane?: boolean;
  onClose: () => void;
  children: (onClose?: () => void) => ReactNode;
}

export function DetailPane({
  desktop,
  label,
  open,
  paneKey,
  showPane = open,
  onClose,
  children,
}: DetailPaneProps) {
  if (desktop) {
    return (
      showPane && (
        <aside
          key={paneKey}
          aria-label={label}
          className="rounded-card border-border bg-surface shadow-raised motion-safe:animate-pop sticky top-4 border"
        >
          {children()}
        </aside>
      )
    );
  }
  return (
    <Dialog open={open} onClose={onClose} title={label} placement="sheet" bare>
      {open && children(onClose)}
    </Dialog>
  );
}
