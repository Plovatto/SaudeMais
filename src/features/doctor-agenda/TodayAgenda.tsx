import type { UseQueryResult } from '@tanstack/react-query';
import { Fragment } from 'react';
import { bookingStatus, hasStarted } from '@components/bookings/booking-display';
import { DateTile } from '@components/bookings/DateTile';
import {
  ListMessage,
  ListRow,
  ListSkeleton,
  QueryError,
  SectionCard,
  SectionLink,
  StatusChip,
} from '@components/ui';
import { doctorAgendaUrl } from '@constants/doctor-agenda';
import { visitTypeLabels } from '@constants/visit-types';
import type { DoctorAppointment } from '@lib/api/models';
import { formatTime } from '@lib/date';
import { plural } from '@lib/plural';

export interface TodayAgendaProps {
  query: UseQueryResult<DoctorAppointment[]>;
  now: Date;
  onView: (appointment: DoctorAppointment) => void;
}

function NowLine({ now }: { now: Date }) {
  return (
    <li
      aria-hidden
      className="text-danger-text after:bg-danger flex items-center gap-2.5 px-4 py-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase after:h-px after:flex-1 after:opacity-45 lg:px-5"
    >
      Agora · {formatTime(now.toISOString())}
    </li>
  );
}

interface TodayRowProps {
  appointment: DoctorAppointment;
  now: Date;
  onView: () => void;
}

function TodayRow({ appointment, now, onView }: TodayRowProps) {
  const status = bookingStatus(appointment, 'doctor', now.getTime());
  return (
    <ListRow
      onClick={onView}
      aria-haspopup="dialog"
      leading={
        <DateTile startsAt={appointment.startsAt} muted={hasStarted(appointment.startsAt, now.getTime())} />
      }
      title={appointment.patient.fullName}
      meta={
        <>
          <time dateTime={appointment.startsAt} className="text-text font-semibold">
            {formatTime(appointment.startsAt)}
          </time>{' '}
          · {visitTypeLabels[appointment.visitType]}
        </>
      }
      trailing={<StatusChip tone={status.tone}>{status.label}</StatusChip>}
    />
  );
}

export function TodayAgenda({ query, now, onView }: TodayAgendaProps) {
  const items = query.data;
  const upcoming = items ? items.findIndex(({ startsAt }) => new Date(startsAt) > now) : -1;
  const nowAt = upcoming === -1 ? items?.length : upcoming;

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
        <ul className="divide-border divide-y">
          {items.map((appointment, index) => (
            <Fragment key={appointment.id}>
              {index === nowAt && <NowLine now={now} />}
              <li>
                <TodayRow appointment={appointment} now={now} onView={() => onView(appointment)} />
              </li>
            </Fragment>
          ))}
          {nowAt === items.length && <NowLine now={now} />}
        </ul>
      )}
    </SectionCard>
  );
}
