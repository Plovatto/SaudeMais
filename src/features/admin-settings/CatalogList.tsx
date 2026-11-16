import type { QueryKey } from '@tanstack/react-query';
import { useRef, type ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Button } from '@components/ui';
import type { Page } from '@lib/api/page';
import { CatalogItems } from './CatalogItems';
import { catalogMessages } from './catalog-messages';
import { PagedList } from './PagedList';
import { SettingsSection } from './SettingsSection';
import { useActiveToggle } from './useActiveToggle';
import { useCatalogEditor } from './useCatalogEditor';

interface CatalogItem {
  id: string;
  isActive: boolean;
}

export interface CatalogListProps<T extends CatalogItem> {
  title: string;
  description: string;
  createLabel: string;
  editLabel: string;
  emptyTitle: string;
  queryKey: QueryKey;
  load: (page: number, signal: AbortSignal) => Promise<Page<T>>;
  describe: (item: T) => { name: string; details: string };
  setActive: (item: T, isActive: boolean) => Promise<unknown>;
  renderForm: (item: T | null, close: () => void) => ReactNode;
}

const idOf = (item: CatalogItem) => item.id;

export function CatalogList<T extends CatalogItem>({
  title,
  description,
  createLabel,
  editLabel,
  emptyTitle,
  queryKey,
  load,
  describe,
  setActive,
  renderForm,
}: CatalogListProps<T>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toggle = useActiveToggle<T>({
    nameOf: (item) => describe(item).name,
    keyOf: idOf,
    setActive,
    invalidate: queryKey,
  });
  const editor = useCatalogEditor<T>(headingRef);

  return (
    <SettingsSection
      title={title}
      description={description}
      headingRef={headingRef}
      action={
        <Button icon={<LuPlus />} onClick={editor.create}>
          {createLabel}
        </Button>
      }
    >
      <PagedList queryKey={queryKey} load={load} messages={catalogMessages}>
        {(items) => (
          <CatalogItems
            items={items}
            keyOf={idOf}
            describe={describe}
            isBusy={toggle.isBusy}
            onToggle={toggle.request}
            onEdit={editor.edit}
            empty={{
              title: emptyTitle,
              description: 'Os itens cadastrados aparecem aqui.',
              actionLabel: createLabel,
              onCreate: editor.create,
            }}
          />
        )}
      </PagedList>
      {editor.panel((item) => (item ? editLabel : createLabel), renderForm)}
      {toggle.confirmation}
    </SettingsSection>
  );
}
