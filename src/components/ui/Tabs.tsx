import type { KeyboardEvent, ReactNode } from 'react';
import { cx } from '@lib/cx';
import { rovingIndex } from '@lib/roving-index';
import { IconSlot } from './IconSlot';
import { pill, tile } from './styles';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: ReactNode;
}

const variants = {
  pill: { ...pill, base: cx(pill.base, 'flex-1') },
  tile: { ...tile, base: cx(tile.base, 'flex-1') },
};

interface TileContentProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export function TileContent({ icon, label, children }: TileContentProps) {
  return (
    <>
      <IconSlot className="bg-role-soft text-role-text mb-1 size-8 justify-center rounded-full text-lg">
        {icon}
      </IconSlot>
      {children} <span className="text-text-secondary text-xs font-medium">{label}</span>
    </>
  );
}

export interface TabsProps<T extends string> {
  id: string;
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  variant?: keyof typeof variants;
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
  const styles = variants[variant];
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
        return (
          <button
            key={item.value}
            id={tabId(id, item.value)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={selected ? panelId(id, item.value) : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cx(styles.base, selected ? styles.selected : styles.idle)}
          >
            {variant === 'tile' ? (
              <TileContent icon={item.icon} label={item.label}>
                <span className="text-lg font-bold tabular-nums">{item.count}</span>
              </TileContent>
            ) : (
              item.label
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
