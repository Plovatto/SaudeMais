import { useRef } from 'react';
import { LuPlus, LuSearchX, LuUsers } from 'react-icons/lu';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, Card, EmptyState, SearchInput, Select, TabPanel, Tabs } from '@components/ui';
import { NEW_USER, USER_PARAM } from '@constants/admin-users';
import { RESET_PAGE } from '@hooks/usePageParam';
import { useSearchDraft } from '@hooks/useSearchDraft';
import { scrollFadeClass, useScrollFade } from '@hooks/useScrollFade';
import { useSearchParam } from '@hooks/useSearchParam';
import { useTabbedList } from '@hooks/useTabbedList';
import { useCurrentUser } from '@lib/auth/useSession';
import { plural } from '@lib/plural';
import { queryKeys } from '@lib/query-keys';
import { UserPanel } from './UserPanel';
import { UserRow } from './UserRow';
import {
  usersApi,
  type AdminUser,
  type UserListParams,
  type UserRoleFilter,
  type UserStatusFilter,
} from './users-api';

const ROLE_TABS = [
  { value: 'todos', label: 'Todos', role: '' },
  { value: 'pacientes', label: 'Pacientes', role: 'patient' },
  { value: 'medicos', label: 'Médicos', role: 'doctor' },
  { value: 'administradores', label: 'Administradores', role: 'admin' },
] as const satisfies readonly { value: string; label: string; role: UserRoleFilter }[];

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todas as situações', status: '' },
  { value: 'ativos', label: 'Ativos', status: 'active' },
  { value: 'inativos', label: 'Inativos', status: 'inactive' },
] as const satisfies readonly { value: string; label: string; status: UserStatusFilter }[];

type RoleTab = (typeof ROLE_TABS)[number]['value'];

const TABS_ID = 'admin-users';

const found = (total: number) => plural(total, 'usuário encontrado', 'usuários encontrados');

export function UsersPage() {
  const currentUser = useCurrentUser();
  const results = useRef<HTMLParagraphElement>(null);
  const tabsScroller = useRef<HTMLDivElement>(null);
  const tabsFade = useScrollFade(tabsScroller);
  const { search, setSearch, searchParam } = useSearchDraft('busca');
  const [statusParam, setStatusParam] = useSearchParam('situacao', 'todos');
  const [, setUserParam] = useSearchParam(USER_PARAM);
  const statusOption = STATUS_OPTIONS.find((option) => option.value === statusParam) ?? STATUS_OPTIONS[0];
  const list = useTabbedList(
    ROLE_TABS,
    ({ role }, page) => {
      const params: UserListParams = { page, search: searchParam, role, status: statusOption.status };
      return {
        queryKey: queryKeys.adminUsers.list(params),
        queryFn: (signal: AbortSignal) => usersApi.list(params, signal),
      };
    },
    [],
    'perfil',
  );
  const openUser = (user: AdminUser) => setUserParam(user.id);
  const filtered = searchParam !== '' || list.tab.role !== '' || statusOption.status !== '';

  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle="Pessoas com acesso ao Saúde+ e o que cada uma pode fazer."
        action={
          <Button icon={<LuPlus />} aria-haspopup="dialog" onClick={() => setUserParam(NEW_USER)}>
            Novo usuário
          </Button>
        }
      />
      <div ref={tabsScroller} data-fade={tabsFade} className={`overflow-x-auto ${scrollFadeClass}`}>
        <Tabs<RoleTab>
          id={TABS_ID}
          label="Filtrar por perfil"
          variant="line"
          items={ROLE_TABS}
          value={list.tab.value}
          onValueChange={list.selectTab}
          className="w-max min-w-full"
        />
      </div>
      <TabPanel tabsId={TABS_ID} value={list.tab.value} className="mt-4 flex flex-col gap-3">
        <Card className="flex flex-col gap-3 p-3 sm:flex-row lg:p-4">
          <SearchInput
            label="Buscar usuários"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            maxLength={120}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:flex-1"
          />
          <Select
            label="Situação"
            labelHidden
            value={statusOption.value}
            onChange={(event) => setStatusParam(event.target.value, RESET_PAGE)}
            className="sm:w-56"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Card>
        <PagedResults<AdminUser>
          bare
          list={list}
          found={found}
          resultsRef={results}
          empty={
            <Card>
              <EmptyState
                icon={filtered ? <LuSearchX /> : <LuUsers />}
                title={filtered ? 'Ninguém encontrado' : 'Nenhum usuário cadastrado'}
                description={
                  filtered ? 'Tente outro nome, e-mail ou filtro.' : 'As contas criadas aparecem aqui.'
                }
              />
            </Card>
          }
        >
          {(items) => (
            <Card as="section" variant="plain" aria-label="Lista de usuários" className="overflow-hidden">
              <ul className="divide-border divide-y">
                {items.map((user) => (
                  <li key={user.id}>
                    <UserRow user={user} isSelf={user.id === currentUser.id} onOpen={openUser} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </PagedResults>
      </TabPanel>
      <UserPanel fallbackFocus={results} />
    </>
  );
}
