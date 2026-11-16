import { CatalogRow } from './CatalogRow';
import { ItemList, type EmptyList } from './ItemList';

export interface CatalogItemsProps<T extends { isActive: boolean }> {
  items: readonly T[] | undefined;
  keyOf: (item: T) => string;
  describe: (item: T) => { name: string; details: string };
  isBusy: (item: T) => boolean;
  onToggle: (item: T, isActive: boolean) => void;
  onEdit: (item: T) => void;
  empty: EmptyList;
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
  return (
    <ItemList
      items={items}
      keyOf={keyOf}
      empty={empty}
      renderItem={(item) => (
        <CatalogRow
          {...describe(item)}
          isActive={item.isActive}
          busy={isBusy(item)}
          onToggle={(isActive) => onToggle(item, isActive)}
          onEdit={() => onEdit(item)}
        />
      )}
    />
  );
}
