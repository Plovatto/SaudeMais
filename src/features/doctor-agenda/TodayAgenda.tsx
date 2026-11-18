import type { UseQueryResult } from '@tanstack/react-query';
import { ListMessage, ListSkeleton, QueryError, SectionCard, SectionLink } from '@components/ui';
import { doctorAgendaUrl } from '@constants/doctor-agenda';
import type { DoctorAppointment } from '@lib/api/models';
import { plural } from '@lib/plural';
import { AgendaRow, AgendaRows } from './AgendaRows';

export interface TodayAgendaProps {
  query: UseQueryResult<DoctorAppointment[]>;
  now: Date;
  onView: (appointment: DoctorAppointment) => void;
}

export function TodayAgenda({ query, now, onView }: TodayAgendaProps) {
  const items = query.data;

  return (
    <SectionCard
      title="Agenda de hoje"
      flush
      aria-busy={query.isPending}
      action={
        <>
          {items && (
            <span className="text-text-muted text-[0.8125rem] whitespace-nowrap tabular-nums">
              {plural(items.length, 'consulta', 'consultas')}
            </span>
          )}
          <SectionLink to={doctorAgendaUrl()}>Ver tudo</SectionLink>
        </>
      }
    >
      {query.isPending && <ListSkeleton />}
      {query.isError && !items && (
        <QueryError padded error={query.error} onRetry={() => void query.refetch()} />
      )}
      {items?.length === 0 && <ListMessage>Sem consultas hoje.</ListMessage>}
      {items && items.length > 0 && (
        <AgendaRows
          items={items}
          now={now}
          showNow
          row={(appointment) => <AgendaRow appointment={appointment} now={now} onView={onView} />}
        />
      )}
    </SectionCard>
  );
}
