import type { ReactNode } from 'react';
import { Dialog } from '@components/ui';
import { cx } from '@lib/cx';

interface DetailPaneView {
  sheet: boolean;
  onClose: () => void;
}

interface DetailPaneProps {
  desktop: boolean;
  label: string;
  open: boolean;
  paneKey: string | undefined;
  desktopVisible?: boolean;
  onClose: () => void;
  children: (view: DetailPaneView) => ReactNode;
}

export function DetailPane({
  desktop,
  label,
  open,
  paneKey,
  desktopVisible = open,
  onClose,
  children,
}: DetailPaneProps) {
  if (desktop) {
    return (
      desktopVisible && (
        <aside
          key={paneKey}
          aria-label={label}
          className={cx(
            'rounded-card border-border bg-surface motion-safe:animate-pop sticky top-4 border',
            paneKey === undefined ? 'shadow-card' : 'shadow-raised',
          )}
        >
          {children({ sheet: false, onClose })}
        </aside>
      )
    );
  }
  return (
    <Dialog open={open} onClose={onClose} title={label} placement="sheet" bare>
      {open && children({ sheet: true, onClose })}
    </Dialog>
  );
}
