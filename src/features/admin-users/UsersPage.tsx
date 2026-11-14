import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { LuUsers } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import {
  Card,
  EmptyState,
  Pagination,
  QueryError,
  SearchInput,
  Select,
  Skeleton,
  TabPanel,
  Tabs,
} from '@components/ui';
import { useClampedPage, usePageParam } from '@hooks/usePageParam';
import { useSearchParam } from '@hooks/useSearchParam';
import { useCurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import { useUserActions } from './useUserActions';
import { userLocks } from './user-cache';
import { userMessages } from './user-messages';
import { UserRow } from './UserRow';
import { usersApi, type UserListParams, type UserRoleFilter, type UserStatusFilter } from './users-api';

const ROLE_TABS = [
  { value: 'todos', label: 'Todos', role: '' },
  { value: 'medicos', label: 'Médicos', role: 'doctor' },
  { value: 'pacientes', label: 'Pacientes', role: 'patient' },
] as const satisfies readonly { value: string; label: string; role: UserRoleFilter }[];

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todas as situações', status: '' },
  { value: 'ativos', label: 'Ativos', status: 'active' },
  { value: 'inativos', label: 'Inativos', status: 'inactive' },
] as const satisfies readonly { value: string; label: string; status: UserStatusFilter }[];

type RoleTab = (typeof ROLE_TABS)[number]['value'];

const TABS_ID = 'admin-users';
const SEARCH_DELAY_MS = 300;
const RESET_PAGE = { replace: true, reset: ['pagina'] } as const;

const found = (total: number) => (total === 1 ? '1 usuário encontrado' : `${total} usuários encontrados`);

function useDebouncedSearch() {
  const [search, setSearch] = useSearchParam('busca');
  const [draft, setDraft] = useState(search);
  const [synced, setSynced] = useState(search);
  if (synced !== search) {
    setSynced(search);
    if (draft.trim() !== search) setDraft(search);
  }
  useEffect(() => {
    const next = draft.trim();
    if (next === search) return;
    const timer = setTimeout(() => setSearch(next, RESET_PAGE), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, search, setSearch]);
  return { search, draft, setDraft };
}

export function UsersPage() {
  const currentUser = useCurrentUser();
  const [page, setPage] = usePageParam();
  const { search, draft, setDraft } = useDebouncedSearch();
  const [roleParam, setRoleParam] = useSearchParam('perfil', 'todos');
  const [statusParam, setStatusParam] = useSearchParam('situacao', 'todos');
  const roleTab = ROLE_TABS.find((tab) => tab.value === roleParam) ?? ROLE_TABS[0];
  const statusOption = STATUS_OPTIONS.find((option) => option.value === statusParam) ?? STATUS_OPTIONS[0];
  const params: UserListParams = { page, search, role: roleTab.role, status: statusOption.status };
  const query = useQuery({
    queryKey: queryKeys.adminUsers.list(params),
    queryFn: ({ signal }) => usersApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
  const { lastPage, outOfRange } = useClampedPage(page, setPage, query.data);
  const results = useRef<HTMLParagraphElement>(null);
  const actions = useUserActions(results);
  const items = outOfRange ? undefined : query.data?.items;
  const filtered = search !== '' || roleTab.role !== '' || statusOption.status !== '';

  return (
    <>
      <PageHeader title="Usuários" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <SearchInput
            label="Buscar usuários"
            placeholder="Buscar por nome ou e-mail"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="lg:flex-1"
          />
          <Select
            label="Situação"
            labelHidden
            value={statusOption.value}
            onChange={(event) => setStatusParam(event.target.value, RESET_PAGE)}
            className="lg:w-56"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <Tabs<RoleTab>
          id={TABS_ID}
          label="Perfil"
          items={ROLE_TABS}
          value={roleTab.value}
          onValueChange={(value) => setRoleParam(value, RESET_PAGE)}
          className="lg:max-w-md"
        />
        <TabPanel tabsId={TABS_ID} value={roleTab.value} className="flex flex-col gap-4">
          <p
            ref={results}
            tabIndex={-1}
            aria-live="polite"
            className="text-text-secondary text-sm focus-visible:outline-none"
          >
            {query.data && !outOfRange ? found(query.data.total) : null}
          </p>
          {query.isPending && (
            <div aria-busy="true" className="flex flex-col gap-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          )}
          {query.isError && (
            <QueryError error={query.error} messages={userMessages} onRetry={() => void query.refetch()} />
          )}
          {items?.length === 0 && (
            <EmptyState
              icon={<LuUsers />}
              title={filtered ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              description={
                filtered ? 'Tente outro termo de busca ou outro filtro.' : 'As contas criadas aparecem aqui.'
              }
            />
          )}
          {items && items.length > 0 && (
            <Card className="p-3 lg:p-0">
              <table role="table" className="block w-full lg:table">
                <caption className="sr-only">Usuários</caption>
                <thead role="rowgroup" className="sr-only lg:not-sr-only lg:table-header-group">
                  <tr role="row" className="text-text-secondary text-start text-xs font-semibold uppercase">
                    <th role="columnheader" scope="col" className="px-4 py-3 text-start">
                      Usuário
                    </th>
                    <th role="columnheader" scope="col" className="px-4 py-3 text-start">
                      Situação e perfis
                    </th>
                    <th role="columnheader" scope="col" className="px-4 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody role="rowgroup" className="flex flex-col gap-3 lg:table-row-group">
                  {items.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      locks={userLocks(user, currentUser.id)}
                      actions={actions.itemsFor(user)}
                      busy={actions.busyId === user.id}
                    />
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <Pagination
            page={page}
            totalPages={query.data ? lastPage : 0}
            onPageChange={(next) => setPage(next)}
          />
        </TabPanel>
      </div>
      {actions.dialogs}
    </>
  );
}
