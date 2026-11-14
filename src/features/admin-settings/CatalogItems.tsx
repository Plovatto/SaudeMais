import { LuInbox } from 'react-icons/lu';
import { Button, Card, EmptyState } from '@components/ui';
import { CatalogRow } from './CatalogRow';

export interface CatalogItemsProps<T extends { isActive: boolean }> {
  items: readonly T[] | undefined;
  keyOf: (item: T) => string;
  describe: (item: T) => { name: string; details: string };
  isBusy: (item: T) => boolean;
  onToggle: (item: T, isActive: boolean) => void;
  onEdit: (item: T) => void;
  empty: { title: string; description: string; actionLabel: string; onCreate: () => void };
}

export function CatalogItems<T extends { isActive: boolean }>({
  items,
  keyOf,
  describe,
  isBusy,
  onToggle,
  onEdit,
  empty,
}: CatalogItemsProps<T>) {
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
        <CatalogRow
          key={keyOf(item)}
          {...describe(item)}
          isActive={item.isActive}
          busy={isBusy(item)}
          onToggle={(isActive) => onToggle(item, isActive)}
          onEdit={() => onEdit(item)}
        />
      ))}
    </ul>
  );
}
