import type { ReactNode } from 'react';
import { ListMessage } from '@components/ui';

export interface ItemListProps<T> {
  items: readonly T[];
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  empty: string;
}

export function ItemList<T>({ items, keyOf, renderItem, empty }: ItemListProps<T>) {
  if (items.length === 0) return <ListMessage>{empty}</ListMessage>;
  return (
    <ul className="divide-border divide-y">
      {items.map((item) => (
        <li key={keyOf(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
