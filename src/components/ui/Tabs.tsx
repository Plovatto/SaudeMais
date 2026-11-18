import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { cx } from '@lib/cx';
import { rovingIndex } from '@lib/roving-index';
import { CountBadge } from './CountBadge';
import { pill } from './styles';
import { TileButton } from './TileButton';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: ReactNode;
}

export interface TabsProps<T extends string> {
  id: string;
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  variant?: 'pill' | 'tile' | 'line' | 'chip';
  className?: string;
}

const listLayout: Record<NonNullable<TabsProps<string>['variant']>, string> = {
  pill: 'gap-3',
  tile: 'gap-3',
  line: 'border-border gap-1 border-b',
  chip: '-mx-1 gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0',
};

const safe = (value: string) => encodeURIComponent(value).replace(/%/g, '_');
const tabId = (id: string, value: string) => `${id}-tab-${safe(value)}`;
const panelId = (id: string, value: string) => `${id}-panel-${safe(value)}`;

interface IndicatorBox {
  left: number;
  width: number;
  animate: boolean;
}

function useIndicator(listRef: RefObject<HTMLDivElement | null>, value: string, enabled: boolean) {
  const [box, setBox] = useState<IndicatorBox | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!enabled || !list) return;
    const measure = () => {
      const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      setBox((previous) =>
        tab ? { left: tab.offsetLeft, width: tab.offsetWidth, animate: previous !== null } : null,
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [listRef, value, enabled]);

  return box;
}

function LineIndicator({ box }: { box: IndicatorBox }) {
  return (
    <span
      aria-hidden
      data-tab-indicator
      className={cx(
        'bg-role-strong pointer-events-none absolute start-0 -bottom-px h-0.5 w-px origin-left',
        box.animate && 'ease-out-quint transition-transform duration-180',
      )}
      style={{ transform: `translateX(${box.left}px) scaleX(${box.width})` }}
    />
  );
}

export function Tabs<T extends string>({
  id,
  label,
  items,
  value,
  onValueChange,
  variant = 'pill',
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicator = useIndicator(listRef, value, variant === 'line');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = items.findIndex((item) => item.value === value);
    const next = rovingIndex(event.key, current, items.length, 'horizontal');
    const target = next === undefined ? undefined : items[next];
    if (!target) return;
    event.preventDefault();
    onValueChange(target.value);
    document.getElementById(tabId(id, target.value))?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx('flex', variant === 'line' && 'relative', listLayout[variant], className)}
    >
      {variant === 'line' && indicator && <LineIndicator box={indicator} />}
      {items.map((item) => {
        const selected = item.value === value;
        const tab = {
          id: tabId(id, item.value),
          role: 'tab',
          'aria-selected': selected,
          'aria-controls': selected ? panelId(id, item.value) : undefined,
          tabIndex: selected ? 0 : -1,
          onClick: () => onValueChange(item.value),
        } as const;
        if (variant === 'line') {
          return (
            <button
              key={item.value}
              type="button"
              {...tab}
              className={cx(
                '-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                selected ? 'text-role-text' : 'text-text-secondary can-hover:text-text',
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <CountBadge
                  inline
                  className={cx(
                    'text-[0.71875rem] transition-colors duration-150',
                    selected ? 'bg-role-strong text-on-role' : 'bg-surface-strong text-text-secondary',
                  )}
                >
                  {item.count}
                </CountBadge>
              )}
            </button>
          );
        }
        return variant === 'tile' ? (
          <TileButton
            key={item.value}
            {...tab}
            icon={item.icon}
            label={item.label}
            selected={selected}
            className="flex-1"
          >
            <span className="text-lg font-bold tabular-nums">{item.count}</span>
          </TileButton>
        ) : (
          <button
            key={item.value}
            type="button"
            {...tab}
            className={cx(
              pill.base,
              variant === 'chip' ? 'inline-flex shrink-0 items-center gap-2 whitespace-nowrap' : 'flex-1',
              selected ? pill.selected : pill.idle,
            )}
          >
            {item.label}
            {variant === 'chip' && item.count !== undefined && (
              <>
                {' '}
                <span className={cx('tabular-nums', selected ? 'opacity-85' : 'text-text-muted')}>
                  {item.count}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  tabsId: string;
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ tabsId, value, children, className }: TabPanelProps) {
  return (
    <div
      id={panelId(tabsId, value)}
      role="tabpanel"
      aria-labelledby={tabId(tabsId, value)}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
