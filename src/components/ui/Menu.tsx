import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { LuCheck, LuEllipsisVertical } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { moveFocus } from '@lib/roving-index';
import { IconButton } from './IconButton';
import { IconSlot } from './IconSlot';
import { brandSurface, floatingPanel } from './styles';
import { useFloating } from './useFloating';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  media?: ReactNode;
  tone?: 'default' | 'danger';
  checked?: boolean;
  group?: string;
  disabled?: boolean;
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

export interface MenuTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  open: boolean;
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  'aria-haspopup': 'menu';
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

type MenuSurface = 'default' | 'brand';

export interface MenuProps {
  label: string;
  items: readonly MenuItem[];
  icon?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  trigger?: (props: MenuTriggerProps) => ReactNode;
  header?: ReactNode;
  surface?: MenuSurface;
  groupLabels?: boolean;
  panelClassName?: string;
}

const surfaces = {
  default: {
    panel: '',
    item: 'text-text can-hover:bg-role-soft focus-visible:bg-role-soft',
    danger: 'text-danger-text can-hover:bg-danger-soft focus-visible:bg-danger-soft',
    muted: 'text-text-muted',
    check: 'text-role-text',
    rule: 'border-border',
  },
  brand: {
    panel: `${brandSurface} border-white/12 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.55)]`,
    item: 'text-white/85 can-hover:bg-white/8 can-hover:text-white focus-visible:bg-white/10 focus-visible:text-white',
    danger: 'text-[#ffb4a8] can-hover:bg-white/8 focus-visible:bg-white/10',
    muted: 'text-white/60',
    check: 'text-role',
    rule: 'border-white/10',
  },
} satisfies Record<MenuSurface, Record<string, string>>;

export function Menu({
  label,
  items,
  icon = <LuEllipsisVertical />,
  align = 'end',
  className,
  trigger,
  header,
  surface = 'default',
  groupLabels = false,
  panelClassName,
}: MenuProps) {
  const look = surfaces[surface];
  const withMedia = items.some((item) => item.media !== undefined);
  const { open, setOpen, dismiss, rootRef, contentId, triggerProps, placement } = useFloating();
  const [focusOnOpen, setFocusOnOpen] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) itemRefs.current[focusOnOpen]?.focus();
  }, [open, focusOnOpen]);

  const openAt = (index: number) => {
    setFocusOnOpen(index);
    setOpen(true);
  };

  const toggle = () => (open ? dismiss() : openAt(0));

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openAt(event.key === 'ArrowDown' ? 0 : items.length - 1);
  };

  return (
    <div ref={rootRef} className={cx('relative inline-flex', className)}>
      {trigger ? (
        trigger({
          ...triggerProps,
          open,
          'aria-haspopup': 'menu',
          onClick: toggle,
          onKeyDown: onTriggerKeyDown,
        })
      ) : (
        <IconButton
          {...triggerProps}
          label={label}
          icon={icon}
          aria-haspopup="menu"
          onClick={toggle}
          onKeyDown={onTriggerKeyDown}
        />
      )}
      {open && (
        <div
          id={contentId}
          style={placement.style}
          className={cx(floatingPanel(align, placement.side), 'min-w-56', look.panel, panelClassName)}
        >
          {header && <div className={cx('border-b', look.rule)}>{header}</div>}
          <ul
            role="menu"
            aria-label={label}
            onKeyDown={(event) => moveFocus(event, 'button', 'vertical')}
            className="p-1.5"
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
                    aria-disabled={item.disabled}
                    tabIndex={-1}
                    onClick={() => {
                      if (item.disabled) return;
                      dismiss();
                      item.onSelect();
                    }}
                    className={cx(
                      'flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-start text-sm font-medium transition-colors duration-150 focus-visible:-outline-offset-2',
                      item.media !== undefined && 'py-1.5',
                      item.disabled
                        ? cx(look.muted, 'cursor-not-allowed')
                        : item.tone === 'danger'
                          ? look.danger
                          : look.item,
                      item.checked && surface === 'brand' && 'font-semibold text-white',
                    )}
                  >
                    {item.media ??
                      (item.icon && (
                        <IconSlot className={cx('text-lg', withMedia && 'w-8 justify-center')}>
                          {item.icon}
                        </IconSlot>
                      ))}
                    <span className="flex-1">{item.label}</span>
                    {item.checked && (
                      <IconSlot className={cx(look.check, 'text-lg')}>
                        <LuCheck />
                      </IconSlot>
                    )}
                  </button>
                </li>
              ));
              return (
                <Fragment key={segment.group ?? `items-${segmentIndex}`}>
                  {segmentIndex > 0 && (
                    <li role="separator" className={cx(look.rule, '-mx-1.5 my-1.5 border-t')} />
                  )}
                  {segment.group ? (
                    <li role="none">
                      {groupLabels && (
                        <span
                          aria-hidden
                          className={cx(
                            look.muted,
                            'block px-2.5 pt-1.5 pb-1 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase',
                          )}
                        >
                          {segment.group}
                        </span>
                      )}
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
        </div>
      )}
    </div>
  );
}
