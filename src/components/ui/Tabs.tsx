import type { KeyboardEvent, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { rovingIndex } from '@lib/roving-index';
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
  variant?: 'pill' | 'tile';
  className?: string;
}

const safe = (value: string) => encodeURIComponent(value).replace(/%/g, '_');
const tabId = (id: string, value: string) => `${id}-tab-${safe(value)}`;
const panelId = (id: string, value: string) => `${id}-panel-${safe(value)}`;

export function Tabs<T extends string>({
  id,
  label,
  items,
  value,
  onValueChange,
  variant = 'pill',
  className,
}: TabsProps<T>) {
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
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex gap-3', className)}>
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
            className={cx(pill.base, 'flex-1', selected ? pill.selected : pill.idle)}
          >
            {item.label}
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
