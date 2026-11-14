import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import { useRef, type ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Button, Pagination, QueryError, Skeleton } from '@components/ui';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import type { Page } from '@lib/api/page';
import { CatalogItems } from './CatalogItems';
import { catalogMessages } from './catalog-messages';
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
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: ({ signal }) => load(page, signal),
    placeholderData: keepPreviousData,
  });
  const toggle = useActiveToggle<T>({
    nameOf: (item) => describe(item).name,
    keyOf: idOf,
    setActive,
    invalidate: queryKey,
  });
  const editor = useCatalogEditor<T>(headingRef);
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);

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
      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      )}
      {query.isError && (
        <QueryError error={query.error} messages={catalogMessages} onRetry={() => void query.refetch()} />
      )}
      {!outOfRange && (
        <CatalogItems
          items={query.data?.items}
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
      <Pagination page={page} totalPages={query.data ? lastPage : 0} onPageChange={(next) => setPage(next)} />
      {editor.panel((item) => (item ? editLabel : createLabel), renderForm)}
      {toggle.confirmation}
    </SettingsSection>
  );
}
