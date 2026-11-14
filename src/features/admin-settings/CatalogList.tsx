import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import { useEffect, useRef, type ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Button, Pagination, Skeleton } from '@components/ui';
import { CatalogItems } from './CatalogItems';
import { QueryError } from './QueryError';
import type { Page } from './settings-api';
import { SettingsSection } from './SettingsSection';
import { useActiveToggle } from './useActiveToggle';
import { useCatalogEditor } from './useCatalogEditor';
import { useSearchParam } from './useSearchParam';

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
  const [pageParam, setPageParam] = useSearchParam('pagina', '1');
  const page = Math.max(1, Math.trunc(Number(pageParam)) || 1);
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
  const lastPage = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize)) : 1;
  const outOfRange = query.data !== undefined && page > lastPage;

  useEffect(() => {
    if (outOfRange) setPageParam(String(lastPage), { replace: true });
  }, [outOfRange, lastPage, setPageParam]);

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
      {query.isError && <QueryError error={query.error} onRetry={() => void query.refetch()} />}
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
      <Pagination
        page={page}
        totalPages={query.data ? lastPage : 0}
        onPageChange={(next) => setPageParam(String(next))}
      />
      {editor.panel((item) => (item ? editLabel : createLabel), renderForm)}
      {toggle.confirmation}
    </SettingsSection>
  );
}
