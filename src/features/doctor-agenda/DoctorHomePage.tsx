import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { LuCalendarDays, LuCheck, LuClock } from 'react-icons/lu';
import { NextCard, type NextItem } from '@components/bookings/NextCard';
import { PageTitle } from '@components/layout/PageTitle';
import { LastNotification } from '@components/notifications/LastNotification';
import {
  Button,
  EmptyState,
  ListSkeleton,
  QueryError,
  QuickActions,
  stagger,
  type QuickAction,
} from '@components/ui';
import { areas } from '@constants/areas';
import { AGENDA_TABS, doctorAgendaUrl } from '@constants/doctor-agenda';
import { visitTypeLabels } from '@constants/visit-types';
import { useNow } from '@hooks/useNow';
import type { DoctorAppointment } from '@lib/api/models';
import { civilDateInSaoPaulo, formatShortDay, formatTime, MINUTE_MS, whenText } from '@lib/date';
import { cx } from '@lib/cx';
import { AppointmentQueue } from './AppointmentQueue';
import { COMPLETE, CONFIRM, NO_SHOW } from './decisions';
import { ActionTarget, DecisionButton } from './DecisionButton';
import { agendaRangeQuery, doctorHomeQuery, nextAppointmentQuery } from './doctor-api';
import { TodayAgenda } from './TodayAgenda';
import { useAppointmentActions } from './useAppointmentActions';

const DOCTOR = areas.doctor.base;

const ACTIONS: readonly QuickAction[] = [
  {
    to: doctorAgendaUrl(),
    title: 'Abrir agenda',
    hint: 'Consultas de hoje e da semana',
    icon: LuCalendarDays,
    primary: true,
  },
  {
    to: `${DOCTOR}/disponibilidade`,
    title: 'Horários de atendimento',
    hint: 'Dias, intervalos e folgas',
    icon: LuClock,
  },
];

const untilText = (minutes: number) => {
  if (minutes < 60) return `em ${minutes} min`;
  const rest = minutes % 60;
  return `em ${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
};

const dayOf = (iso: string) => civilDateInSaoPaulo(new Date(iso));

export function DoctorHomePage() {
  const now = useNow();
  const today = civilDateInSaoPaulo(now);
  const home = useQuery({ ...doctorHomeQuery, refetchInterval: MINUTE_MS });
  const next = useQuery(nextAppointmentQuery(today));
  const day = useQuery(agendaRangeQuery(today));
  const requests = useRef<HTMLElement>(null);
  const actions = useAppointmentActions(requests);
  const data = home.data;
  const decisionProps = (appointment: DoctorAppointment) => ({
    pending: actions.pendingFor(appointment.id),
    busy: actions.busy,
    onDecide: actions.decide,
    appointment,
    size: 'sm' as const,
  });
  const when = (iso: string) => (dayOf(iso) === today ? `hoje às ${formatTime(iso)}` : whenText(iso));
  const meta = ({ visitType, startsAt }: DoctorAppointment) =>
    `${visitTypeLabels[visitType]} · ${when(startsAt)}`;

  const nextItem = (appointment: DoctorAppointment): NextItem => {
    const isToday = dayOf(appointment.startsAt) === today;
    const minutes = Math.max(
      0,
      Math.ceil((new Date(appointment.startsAt).getTime() - now.getTime()) / MINUTE_MS),
    );
    return {
      onOpen: () => actions.view(appointment),
      startsAt: appointment.startsAt,
      when: `${isToday ? 'Hoje' : formatShortDay(appointment.startsAt)} · ${formatTime(appointment.startsAt)}`,
      detail: `${appointment.patient.fullName} · ${visitTypeLabels[appointment.visitType]}`,
      tag: isToday && (
        <span className="bg-role-soft text-role-text inline-flex items-center gap-[5px] rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap tabular-nums">
          <LuClock aria-hidden className="size-3" />
          {untilText(minutes)}
        </span>
      ),
    };
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle className="sr-only">Início</PageTitle>
      {data?.lastNotification && <LastNotification notification={data.lastNotification} role="doctor" />}
      <div className="@container">
        <div className="grid grid-cols-1 items-start gap-4 lg:gap-5 @min-[880px]:grid-cols-[minmax(0,1fr)_360px] @min-[880px]:items-stretch">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <div className={stagger(0)}>
              <NextCard
                label="Próxima consulta"
                query={next}
                next={next.data ? nextItem(next.data) : undefined}
                empty={{
                  title: 'Nenhuma consulta confirmada por vir',
                  text: 'Veja a agenda dos próximos dias.',
                }}
              />
            </div>
            <div className={stagger(1)}>
              <QuickActions label="Atalhos" actions={ACTIONS} />
            </div>
            {data && data.awaitingRecord.length > 0 && (
              <div className={stagger(2)}>
                <AppointmentQueue
                  title="Aguardando registro"
                  total={data.counts.awaiting}
                  items={data.awaitingRecord}
                  more={doctorAgendaUrl(AGENDA_TABS.awaiting)}
                  meta={meta}
                  onView={actions.view}
                  badge="bg-surface-strong text-text-secondary"
                  placeholder={null}
                  actions={(appointment) => (
                    <>
                      <DecisionButton
                        decision={NO_SHOW}
                        variant="secondary"
                        icon={null}
                        {...decisionProps(appointment)}
                      />
                      <DecisionButton
                        decision={COMPLETE}
                        variant="primary"
                        icon={null}
                        {...decisionProps(appointment)}
                      />
                    </>
                  )}
                />
              </div>
            )}
            <div className={cx(stagger(3), 'flex flex-1 flex-col *:flex-1')}>
              <AppointmentQueue
                sectionRef={requests}
                title="Pedidos a confirmar"
                total={data?.counts.pending}
                items={data?.pending}
                more={doctorAgendaUrl(AGENDA_TABS.pending)}
                meta={meta}
                onView={actions.view}
                badge="bg-role-strong text-on-role"
                placeholder={
                  home.isError && !data ? (
                    <QueryError padded error={home.error} onRetry={() => void home.refetch()} />
                  ) : data ? (
                    <EmptyState
                      icon={<LuCheck />}
                      title="Tudo confirmado"
                      description="Novos pedidos de consulta aparecem aqui."
                      className="gap-5 py-[60px]"
                    />
                  ) : (
                    <ListSkeleton />
                  )
                }
                actions={(appointment) => (
                  <>
                    {appointment.actions.canCancel && (
                      <Button
                        variant="danger-soft-outline"
                        size="sm"
                        onClick={() => actions.cancel(appointment)}
                      >
                        Recusar
                        <ActionTarget appointment={appointment} />
                      </Button>
                    )}
                    <DecisionButton
                      decision={CONFIRM}
                      variant="primary"
                      icon={<LuCheck />}
                      {...decisionProps(appointment)}
                    />
                  </>
                )}
              />
            </div>
          </div>
          <div className={cx(stagger(4), 'flex flex-col *:flex-1')}>
            <TodayAgenda query={day} now={now} onView={actions.view} />
          </div>
        </div>
      </div>
      {actions.dialogs}
    </div>
  );
}
