import { useQuery } from '@tanstack/react-query';
import { useId, useRef } from 'react';
import { LuCalendarX, LuSearchX } from 'react-icons/lu';
import { DetailPane } from '@components/bookings/DetailPane';
import { PagedResults } from '@components/bookings/PagedResults';
import { PageHeader } from '@components/layout/PageHeader';
import { Card, EmptyState, ListSkeleton, QueryError, SearchInput, TabPanel, Tabs } from '@components/ui';
import { TAB_PARAM } from '@constants/areas';
import { AGENDA_STATUS_PARAM, AGENDA_TABS, AGENDA_VIEWS } from '@constants/doctor-agenda';
import { useListSelection } from '@hooks/useListSelection';
import { useNow } from '@hooks/useNow';
import { useSearchDraft } from '@hooks/useSearchDraft';
import { useSearchParam } from '@hooks/useSearchParam';
import { useTabbedList } from '@hooks/useTabbedList';
import type { DoctorAppointment } from '@lib/api/models';
import { addDays, civilDateInSaoPaulo, formatLongDay, isCivilDate, middayOf, weekOf } from '@lib/date';
import { dayPeriodOf } from '@lib/day-periods';
import { groupBy } from '@lib/group';
import { plural } from '@lib/plural';
import { queryKeys } from '@lib/query-keys';
import { AgendaRow, AgendaRows } from './AgendaRows';
import { AppointmentDetail } from './AppointmentDetail';
import { agendaRangeQuery, doctorApi, type AgendaParams } from './doctor-api';
import { useAppointmentActions } from './useAppointmentActions';
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
const periodLabel = (appointment: DoctorAppointment) => dayPeriodOf(appointment.startsAt).label;

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
  const detailId = useId();
  const results = useRef<HTMLParagraphElement>(null);
  const dayList = useRef<HTMLElement>(null);
  const [view, setView] = useSearchParam(TAB_PARAM, AGENDA_VIEWS.week);
  const [dayParam, setDay] = useSearchParam(DAY_PARAM, today);
  const day = isCivilDate(dayParam) ? dayParam : today;
  const { search, setSearch, searchParam } = useSearchDraft(SEARCH_PARAM, RESET_SELECTION);
  const current: View = view === AGENDA_VIEWS.list ? AGENDA_VIEWS.list : AGENDA_VIEWS.week;
  const actions = useAppointmentActions(current === AGENDA_VIEWS.week ? dayList : results);

  const days = weekOf(day);
  const week = useQuery({
    ...agendaRangeQuery(days[0] ?? day, days[6] ?? day),
    enabled: current === AGENDA_VIEWS.week,
  });
  const byDay = week.data && groupBy(week.data, civilDay);
  const dayItems = byDay && (byDay.get(day) ?? []);

  const list = useTabbedList(
    STATUS_TABS,
    ({ tab }, page) => {
      const params: AgendaParams = {
        tab,
        page,
        ...(tab === 'all' && { from: today }),
        ...(searchParam && { search: searchParam }),
      };
      return {
        queryKey: queryKeys.doctor.appointments(params),
        queryFn: (signal: AbortSignal) => doctorApi.list(params, signal),
      };
    },
    RESET_SELECTION,
    AGENDA_STATUS_PARAM,
  );
  const counts = list.lastData?.counts;
  const allParams: AgendaParams = { tab: 'all', page: 1, from: today };
  const allCount = useQuery({
    queryKey: queryKeys.doctor.appointments(allParams),
    queryFn: ({ signal }) => doctorApi.list(allParams, signal),
    select: ({ total }) => total,
  }).data;

  const visible = current === AGENDA_VIEWS.week ? dayItems : list.items;
  const { desktop, selected, select, closeSheet } = useListSelection(
    SELECTED_PARAM,
    visible,
    (items) => items.find(({ startsAt }) => new Date(startsAt) >= now) ?? items[0],
  );
  const row = rowFor({ selectedId: selected?.id, desktop, now, onView: select });
  const pickDay = (next: string) => setDay(next, { reset: RESET_SELECTION });
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
          { value: AGENDA_VIEWS.list, label: 'Consultas', count: allCount },
        ]}
        value={current}
        onValueChange={(next) => setView(next, { reset: [...RESET_SELECTION, DAY_PARAM] })}
      />
      <TabPanel tabsId={VIEWS_ID} value={current} className="mt-4 flex flex-col gap-4">
        {current === AGENDA_VIEWS.week && (
          <WeekStrip
            days={days}
            selected={day}
            today={today}
            countOf={(date) => byDay && (byDay.get(date)?.length ?? 0)}
            onSelect={pickDay}
            onStep={(weeks) => pickDay(addDays(day, weeks * 7))}
            onToday={() => pickDay(today)}
          />
        )}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {current === AGENDA_VIEWS.week ? (
            <section
              ref={dayList}
              tabIndex={-1}
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
                  groupOf={periodLabel}
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
                    count: counts && tab !== 'all' ? counts[tab] : undefined,
                  }))}
                  value={list.tab.value}
                  onValueChange={list.selectTab}
                />
              </Card>
              <TabPanel tabsId={STATUS_ID} value={list.tab.value} className="flex flex-col gap-3">
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
                        groupOf={(appointment) => dayHeading(civilDay(appointment), today)}
                        row={row}
                      />
                    </section>
                  )}
                </PagedResults>
              </TabPanel>
            </div>
          )}
          <DetailPane
            desktop={desktop}
            label="Detalhes da consulta"
            open={selected !== undefined}
            paneKey={selected?.id}
            desktopVisible={visible !== undefined}
            onClose={closeSheet}
          >
            {({ sheet, onClose }) =>
              selected ? (
                <AppointmentDetail
                  appointment={selected}
                  titleId={detailId}
                  {...(sheet && { onClose })}
                  {...detailState}
                />
              ) : (
                <EmptyState
                  icon={<LuCalendarX />}
                  title="Nenhuma consulta selecionada"
                  description="Os detalhes aparecem aqui quando houver uma consulta."
                />
              )
            }
          </DetailPane>
        </div>
      </TabPanel>
      {actions.dialogs}
    </>
  );
}
