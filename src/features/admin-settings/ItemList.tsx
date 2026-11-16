import type { ReactNode } from 'react';
import { LuInbox } from 'react-icons/lu';
import { Button, Card, EmptyState } from '@components/ui';

export interface EmptyList {
  title: string;
  description: string;
  actionLabel: string;
  onCreate: () => void;
}

export interface ItemListProps<T> {
  items: readonly T[] | undefined;
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  empty: EmptyList;
}

export function ItemList<T>({ items, keyOf, renderItem, empty }: ItemListProps<T>) {
  if (!items) return null;
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<LuInbox />}
          title={empty.title}
          description={empty.description}
          action={<Button onClick={empty.onCreate}>{empty.actionLabel}</Button>}
        />
      </Card>
    );
  }
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <li key={keyOf(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
