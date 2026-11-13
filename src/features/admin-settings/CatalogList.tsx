import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { LuInbox, LuPlus } from 'react-icons/lu';
import { Button, Card, Dialog, EmptyState, FormAlert, Pagination, Skeleton } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { CatalogRow } from './CatalogRow';
import type { Page } from './settings-api';
import { SettingsSection } from './SettingsSection';
import { useActiveToggle } from './useActiveToggle';

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

type Editing<T> = { item: T | null } | null;

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
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing<T>>(null);
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: ({ signal }) => load(page, signal),
    placeholderData: keepPreviousData,
  });
  const toggle = useActiveToggle<T>({
    nameOf: (item) => describe(item).name,
    setActive,
    invalidate: queryKey,
  });
  const close = () => setEditing(null);
  const totalPages = query.data ? Math.ceil(query.data.total / query.data.pageSize) : 0;

  return (
    <SettingsSection
      title={title}
      description={description}
      action={
        <Button icon={<LuPlus />} onClick={() => setEditing({ item: null })}>
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
        <div className="flex flex-col items-start gap-3">
          <FormAlert>{errorMessage(query.error)}</FormAlert>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}
      {query.data?.items.length === 0 && (
        <Card>
          <EmptyState
            icon={<LuInbox />}
            title={emptyTitle}
            description="Os itens cadastrados aparecem aqui."
            action={<Button onClick={() => setEditing({ item: null })}>{createLabel}</Button>}
          />
        </Card>
      )}
      {query.data && query.data.items.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {query.data.items.map((item) => (
            <CatalogRow
              key={item.id}
              {...describe(item)}
              isActive={item.isActive}
              busy={toggle.busy}
              onToggle={(isActive) => toggle.request(item, isActive)}
              onEdit={() => setEditing({ item })}
            />
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <Dialog
        open={editing !== null}
        onClose={close}
        placement="side"
        title={editing?.item ? editLabel : createLabel}
      >
        {editing && renderForm(editing.item, close)}
      </Dialog>
      {toggle.confirmation}
    </SettingsSection>
  );
}
