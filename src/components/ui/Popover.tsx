import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '@lib/cx';
import { IconButton } from './IconButton';
import { floatingPanel } from './styles';
import { useFloating } from './useFloating';

export interface PopoverProps {
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
  title: string;
  align?: 'start' | 'end';
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}

export function Popover({
  label,
  icon,
  badge,
  title,
  align = 'end',
  children,
  className,
  panelClassName,
}: PopoverProps) {
  const { open, setOpen, dismiss, rootRef, contentId, triggerProps } = useFloating();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <IconButton
        {...triggerProps}
        label={label}
        icon={icon}
        aria-haspopup="dialog"
        className="relative"
        onClick={() => setOpen((current) => !current)}
      >
        {badge}
      </IconButton>
      {open && (
        <div
          ref={panelRef}
          id={contentId}
          role="dialog"
          aria-label={title}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a')) dismiss('outside');
          }}
          className={cx(
            floatingPanel(align),
            'mt-2 w-[min(22rem,calc(100vw-2rem))] p-4 focus-visible:-outline-offset-2',
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
