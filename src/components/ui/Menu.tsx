import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LuEllipsisVertical } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { rovingIndex } from '@lib/roving-index';
import { IconButton } from './IconButton';
import { IconSlot } from './IconSlot';
import { floatingPanel } from './styles';
import { useFloating } from './useFloating';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
}

export interface MenuProps {
  label: string;
  items: readonly MenuItem[];
  icon?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export function Menu({ label, items, icon = <LuEllipsisVertical />, align = 'end', className }: MenuProps) {
  const { open, setOpen, dismiss, rootRef, contentId, triggerProps } = useFloating();
  const [focusOnOpen, setFocusOnOpen] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) itemRefs.current[focusOnOpen]?.focus();
  }, [open, focusOnOpen]);

  const openAt = (index: number) => {
    setFocusOnOpen(index);
    setOpen(true);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openAt(event.key === 'ArrowDown' ? 0 : items.length - 1);
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const current = itemRefs.current.findIndex((button) => button === document.activeElement);
    const next = rovingIndex(event.key, current, items.length, 'vertical');
    if (next === undefined) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
  };

  return (
    <div ref={rootRef} className={cx('relative inline-flex', className)}>
      <IconButton
        {...triggerProps}
        label={label}
        icon={icon}
        aria-haspopup="menu"
        onClick={() => (open ? dismiss() : openAt(0))}
        onKeyDown={onTriggerKeyDown}
      />
      {open && (
        <ul
          id={contentId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cx(floatingPanel(align), 'mt-1 min-w-48 py-1.5')}
        >
          {items.map((item, index) => (
            <li key={item.label} role="none">
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  dismiss();
                  item.onSelect();
                }}
                className={cx(
                  'flex min-h-11 w-full items-center gap-2.5 px-4 text-start text-sm font-medium focus-visible:-outline-offset-2',
                  item.tone === 'danger'
                    ? 'text-danger-text hover:bg-danger-soft focus-visible:bg-danger-soft'
                    : 'text-text hover:bg-role-soft focus-visible:bg-role-soft',
                )}
              >
                {item.icon && <IconSlot className="text-lg">{item.icon}</IconSlot>}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
