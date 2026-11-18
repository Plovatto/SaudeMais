import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { LuCalendarX, LuSearchX } from 'react-icons/lu';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import {
  Card,
  Dialog,
  EmptyState,
  ListSkeleton,
  QueryError,
  SearchInput,
  TabPanel,
  Tabs,
} from '@components/ui';
import { groupHeader, overline } from '@components/ui/styles';
import { AGENDA_STATUS_PARAM, AGENDA_TABS, AGENDA_VIEWS } from '@constants/doctor-agenda';
import { SEARCH_DELAY_MS, useDebouncedValue } from '@hooks/useDebouncedValue';
import { DESKTOP_QUERY, useMediaQuery } from '@hooks/useMediaQuery';
import { useNow } from '@hooks/useNow';
import { resetPageAnd } from '@hooks/usePageParam';
import { useSearchParam } from '@hooks/useSearchParam';
import { useTabbedList } from '@hooks/useTabbedList';
import type { DoctorAppointment } from '@lib/api/models';
import { cx } from '@lib/cx';
import { addDays, civilDateInSaoPaulo, formatLongDay, formatTime, middayOf } from '@lib/date';
import { plural } from '@lib/plural';
import { queryKeys } from '@lib/query-keys';
import { AgendaRow, AgendaRows } from './AgendaRows';
import { AppointmentDetail } from './AppointmentDetail';
import { agendaRangeQuery, doctorApi, type AgendaParams } from './doctor-api';
import { useAppointmentActions } from './useAppointmentActions';
import { periodOf, weekOf } from './week';
import { WeekStrip } from './WeekStrip';

const VIEWS_ID = 'doctor-agenda';
const STATUS_ID = 'doctor-agenda-status';
const SELECTED_PARAM = 'consulta';
const DAY_PARAM = 'dia';
const SEARCH_PARAM = 'busca';
const RESET_SELECTION = [SELECTED_PARAM];

const STATUS_TABS = [
  { value: AGENDA_TABS.all, label: 'Todas', tab: 'all' },
  { value: AGENDA_TABS.pending, label: 'A confirmar', tab: 'pending' },
  { value: AGENDA_TABS.confirmed, label: 'Confirmadas', tab: 'confirmed' },
  { value: AGENDA_TABS.awaiting, label: 'Aguardando registro', tab: 'awaiting' },
  { value: AGENDA_TABS.history, label: 'Histórico', tab: 'history' },
] as const;

type View = (typeof AGENDA_VIEWS)[keyof typeof AGENDA_VIEWS];
type StatusValue = (typeof STATUS_TABS)[number]['value'];

const consultas = (total: number) => plural(total, 'consulta', 'consultas');
const civilDay = (appointment: DoctorAppointment) => civilDateInSaoPaulo(new Date(appointment.startsAt));
const hourOf = (appointment: DoctorAppointment) => Number(formatTime(appointment.startsAt).slice(0, 2));

function GroupLabel({ children }: { children: ReactNode }) {
  return <li className={cx(groupHeader, overline)}>{children}</li>;
}

const dayHeading = (day: string, today: string) =>
  `${day === today ? 'Hoje · ' : ''}${formatLongDay(middayOf(day))}`;

interface SelectionProps {
  selectedId: string | undefined;
  desktop: boolean;
  now: Date;
  onView: (appointment: DoctorAppointment) => void;
}

function rowFor({ selectedId, desktop, now, onView }: SelectionProps) {
  return (appointment: DoctorAppointment) => (
    <AgendaRow
      appointment={appointment}
      now={now}
      selected={desktop && appointment.id === selectedId}
      opensDialog={!desktop}
      onView={onView}
    />
  );
}

export function DoctorAgendaPage() {
  const now = useNow();
  const today = civilDateInSaoPaulo(now);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const detailId = useId();
  const results = useRef<HTMLParagraphElement>(null);
  const [view, setView] = useSearchParam('aba', AGENDA_VIEWS.week);
  const [day, setDay] = useSearchParam(DAY_PARAM, today);
  const [selectedId, setSelectedId] = useSearchParam(SELECTED_PARAM);
  const [searchParam, setSearchParam] = useSearchParam(SEARCH_PARAM);
  const [search, setSearch] = useState(searchParam);
  const debounced = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const actions = useAppointmentActions(results);
  const current: View = view === AGENDA_VIEWS.list ? AGENDA_VIEWS.list : AGENDA_VIEWS.week;

  const days = weekOf(day);
  const week = useQuery({
    ...agendaRangeQuery(days[0] ?? day, days[6] ?? day),
    enabled: current === AGENDA_VIEWS.week,
  });
  const dayItems = week.data?.filter((appointment) => civilDay(appointment) === day);

  const list = useTabbedList(
    STATUS_TABS,
    ({ tab }, page) => {
      const params: AgendaParams = { tab, page, ...(searchParam && { search: searchParam }) };
      return {
        queryKey: queryKeys.doctor.appointments(params),
        queryFn: (signal: AbortSignal) => doctorApi.list(params, signal),
      };
    },
    RESET_SELECTION,
    AGENDA_STATUS_PARAM,
  );
  const counts = list.lastData?.counts;
  const allCount = counts ? counts.pending + counts.confirmed + counts.history : undefined;

  useEffect(() => {
    if (debounced !== searchParam) setSearchParam(debounced, resetPageAnd(RESET_SELECTION));
  }, [debounced, searchParam, setSearchParam]);

  const visible = current === AGENDA_VIEWS.week ? dayItems : list.items;
  const chosen = visible?.find((appointment) => appointment.id === selectedId);
  const fallback =
    current === AGENDA_VIEWS.week
      ? (dayItems?.find(({ startsAt }) => new Date(startsAt) >= now) ?? dayItems?.[0])
      : list.items?.[0];
  const selected = chosen ?? (desktop ? fallback : undefined);
  const open = (appointment: DoctorAppointment) => setSelectedId(appointment.id);
  const closeSheet = () => setSelectedId('');
  const row = rowFor({ selectedId: selected?.id, desktop, now, onView: open });
  const pickDay = (next: string) => setDay(next === today ? '' : next, { reset: RESET_SELECTION });
  const weekCount = week.data?.length;
  const detailState = {
    pending: selected ? actions.pendingFor(selected.id) : null,
    busy: actions.busy,
    onDecide: actions.decide,
    onCancel: actions.cancel,
  };

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={
          current === AGENDA_VIEWS.week
            ? weekCount === undefined
              ? 'Consultas da semana.'
              : `${consultas(weekCount)} nesta semana`
            : 'Todas as consultas marcadas com você.'
        }
      />
      <Tabs<View>
        id={VIEWS_ID}
        label="Agenda"
        variant="line"
        items={[
          { value: AGENDA_VIEWS.week, label: 'Agenda' },
          { value: AGENDA_VIEWS.list, label: 'Consultas', count: allCount ?? '–' },
        ]}
        value={current}
        onValueChange={(next) => setView(next, { reset: [...RESET_SELECTION, DAY_PARAM] })}
      />
      <TabPanel
        tabsId={VIEWS_ID}
        value={current}
        className="mt-4 flex flex-col gap-4 focus-visible:outline-none"
      >
        {current === AGENDA_VIEWS.week && (
          <WeekStrip
            days={days}
            selected={day}
            today={today}
            countOf={(date) => week.data?.filter((appointment) => civilDay(appointment) === date).length}
            onSelect={pickDay}
            onStep={(weeks) => pickDay(addDays(day, weeks * 7))}
            onToday={() => pickDay(today)}
          />
        )}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {current === AGENDA_VIEWS.week ? (
            <section
              aria-label={`Consultas de ${formatLongDay(middayOf(day))}`}
              aria-busy={week.isPending}
              className="rounded-card border-border bg-surface shadow-card overflow-hidden border"
            >
              {week.isPending && <ListSkeleton />}
              {week.isError && !week.data && (
                <QueryError padded error={week.error} onRetry={() => void week.refetch()} />
              )}
              {dayItems?.length === 0 && (
                <EmptyState
                  icon={<LuCalendarX />}
                  title="Nenhuma consulta neste dia"
                  description="Escolha outro dia na semana acima."
                />
              )}
              {dayItems && dayItems.length > 0 && (
                <AgendaRows
                  items={dayItems}
                  now={now}
                  showNow={day === today}
                  label={(appointment, previous) =>
                    (!previous || periodOf(hourOf(previous)) !== periodOf(hourOf(appointment))) && (
                      <GroupLabel>{periodOf(hourOf(appointment))}</GroupLabel>
                    )
                  }
                  row={row}
                />
              )}
            </section>
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              <Card className="flex flex-col gap-3 p-3 lg:p-4">
                <SearchInput
                  label="Buscar paciente"
                  placeholder="Buscar paciente"
                  value={search}
                  maxLength={120}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Tabs<StatusValue>
                  id={STATUS_ID}
                  label="Situação"
                  variant="chip"
                  items={STATUS_TABS.map(({ value, label, tab }) => ({
                    value,
                    label,
                    count: counts ? (tab === 'all' ? allCount : counts[tab]) : undefined,
                  }))}
                  value={list.tab.value}
                  onValueChange={list.selectTab}
                />
              </Card>
              <TabPanel
                tabsId={STATUS_ID}
                value={list.tab.value}
                className="flex flex-col gap-3 focus-visible:outline-none"
              >
                <PagedResults<DoctorAppointment>
                  bare
                  list={list}
                  found={consultas}
                  resultsRef={results}
                  empty={
                    <Card>
                      <EmptyState
                        icon={searchParam ? <LuSearchX /> : <LuCalendarX />}
                        title="Nenhuma consulta encontrada"
                        description={
                          searchParam ? 'Tente outro nome.' : 'Não há consultas com essa situação.'
                        }
                      />
                    </Card>
                  }
                >
                  {(items) => (
                    <section
                      aria-label="Consultas"
                      className="rounded-card border-border bg-surface shadow-card overflow-hidden border"
                    >
                      <AgendaRows
                        items={items}
                        now={now}
                        showNow={false}
                        label={(appointment, previous) =>
                          (!previous || civilDay(previous) !== civilDay(appointment)) && (
                            <GroupLabel>{dayHeading(civilDay(appointment), today)}</GroupLabel>
                          )
                        }
                        row={row}
                      />
                    </section>
                  )}
                </PagedResults>
              </TabPanel>
            </div>
          )}
          {desktop && selected && (
            <aside
              key={selected.id}
              aria-label="Detalhes da consulta"
              className="rounded-card border-border bg-surface shadow-raised motion-safe:animate-pop sticky top-4 border"
            >
              <AppointmentDetail appointment={selected} titleId={detailId} {...detailState} />
            </aside>
          )}
        </div>
      </TabPanel>
      {!desktop && (
        <Dialog
          open={selected !== undefined}
          onClose={closeSheet}
          title="Detalhes da consulta"
          placement="sheet"
          bare
        >
          {selected && (
            <AppointmentDetail
              appointment={selected}
              titleId={detailId}
              onClose={closeSheet}
              {...detailState}
            />
          )}
        </Dialog>
      )}
      {actions.dialogs}
    </>
  );
}
