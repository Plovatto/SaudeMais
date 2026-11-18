import type { QueryKey } from '@tanstack/react-query';
import { useRef, type ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Button } from '@components/ui';
import type { Page } from '@lib/api/page';
import { CatalogRow } from './CatalogRow';
import { catalogMessages } from './catalog-messages';
import { ItemList } from './ItemList';
import { PagedList } from './PagedList';
import { SettingsCard } from './SettingsCard';
import { useCatalogEditor } from './useCatalogEditor';

interface CatalogItem {
  id: string;
  isActive: boolean;
}

export interface CatalogCardProps<T extends CatalogItem> {
  id: string;
  title: string;
  icon: ReactNode;
  addLabel: string;
  createLabel: string;
  editLabel: string;
  empty: string;
  statusLabels: readonly [active: string, inactive: string];
  queryKey: QueryKey;
  load: (page: number, signal: AbortSignal) => Promise<Page<T>>;
  describe: (item: T) => { name: string; details: string };
  renderForm: (item: T | null, close: () => void) => ReactNode;
}

const idOf = (item: CatalogItem) => item.id;

export function CatalogCard<T extends CatalogItem>({
  id,
  title,
  icon,
  addLabel,
  createLabel,
  editLabel,
  empty,
  statusLabels,
  queryKey,
  load,
  describe,
  renderForm,
}: CatalogCardProps<T>) {
  const cardRef = useRef<HTMLElement>(null);
  const editor = useCatalogEditor<T>(cardRef);

  return (
    <SettingsCard id={id} ref={cardRef} title={title}>
      <PagedList
        param={`pagina-${id}`}
        label={`Páginas de ${title.toLowerCase()}`}
        queryKey={queryKey}
        load={load}
        messages={catalogMessages}
        footer={
          <Button variant="secondary" size="sm" icon={<LuPlus />} onClick={editor.create}>
            {addLabel}
          </Button>
        }
      >
        {(items) => (
          <ItemList
            items={items}
            keyOf={idOf}
            empty={empty}
            renderItem={(item) => (
              <CatalogRow
                {...describe(item)}
                icon={icon}
                isActive={item.isActive}
                status={statusLabels[item.isActive ? 0 : 1]}
                onEdit={() => editor.edit(item)}
              />
            )}
          />
        )}
      </PagedList>
      {editor.panel((item) => (item ? editLabel : createLabel), renderForm)}
    </SettingsCard>
  );
}
