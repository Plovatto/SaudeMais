import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LuCheck, LuEllipsisVertical } from 'react-icons/lu';
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
  checked?: boolean;
  group?: string;
}

interface MenuSegment {
  group: string | undefined;
  entries: { item: MenuItem; index: number }[];
}

function groupItems(items: readonly MenuItem[]): MenuSegment[] {
  const segments: MenuSegment[] = [];
  items.forEach((item, index) => {
    const last = segments.at(-1);
    if (last && last.group === item.group) last.entries.push({ item, index });
    else segments.push({ group: item.group, entries: [{ item, index }] });
  });
  return segments;
}

export interface MenuProps {
  label: string;
  items: readonly MenuItem[];
  icon?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  triggerClassName?: string;
}

export function Menu({
  label,
  items,
  icon = <LuEllipsisVertical />,
  align = 'end',
  className,
  triggerClassName,
}: MenuProps) {
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
        className={triggerClassName}
        onClick={() => (open ? dismiss() : openAt(0))}
        onKeyDown={onTriggerKeyDown}
      />
      {open && (
        <ul
          id={contentId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cx(floatingPanel(align), 'mt-1 min-w-56 py-1.5')}
        >
          {groupItems(items).map((segment, segmentIndex) => {
            const buttons = segment.entries.map(({ item, index }) => (
              <li key={item.label} role="none">
                <button
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
                  aria-checked={item.checked}
                  tabIndex={-1}
                  onClick={() => {
                    dismiss();
                    item.onSelect();
                  }}
                  className={cx(
                    'flex min-h-11 w-full items-center gap-2.5 px-4 text-start text-sm font-medium focus-visible:-outline-offset-2',
                    item.tone === 'danger'
                      ? 'text-danger-text can-hover:bg-danger-soft focus-visible:bg-danger-soft'
                      : 'text-text can-hover:bg-role-soft focus-visible:bg-role-soft',
                  )}
                >
                  {item.icon && <IconSlot className="text-lg">{item.icon}</IconSlot>}
                  <span className="flex-1">{item.label}</span>
                  {item.checked && (
                    <IconSlot className="text-role-text text-lg">
                      <LuCheck />
                    </IconSlot>
                  )}
                </button>
              </li>
            ));
            return (
              <Fragment key={segment.group ?? `items-${segmentIndex}`}>
                {segmentIndex > 0 && <li role="separator" className="border-border my-1.5 border-t" />}
                {segment.group ? (
                  <li role="none">
                    <ul role="group" aria-label={segment.group}>
                      {buttons}
                    </ul>
                  </li>
                ) : (
                  buttons
                )}
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
