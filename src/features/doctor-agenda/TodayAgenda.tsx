import type { UseQueryResult } from '@tanstack/react-query';
import { Fragment } from 'react';
import { bookingStatus, hasStarted } from '@components/bookings/booking-display';
import { DateTile } from '@components/bookings/DateTile';
import {
  ButtonLink,
  ListMessage,
  ListRow,
  ListSkeleton,
  QueryError,
  SectionCard,
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
    <li className="text-danger-text after:bg-danger flex items-center gap-2.5 px-4 py-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase after:h-px after:flex-1 after:opacity-45 lg:px-5">
      Agora · {formatTime(now.toISOString())}
    </li>
  );
}

function TodayRow({ appointment, onView }: { appointment: DoctorAppointment; onView: () => void }) {
  const status = bookingStatus(appointment, 'doctor');
  return (
    <ListRow
      onClick={onView}
      aria-haspopup="dialog"
      leading={<DateTile startsAt={appointment.startsAt} muted={hasStarted(appointment.startsAt)} />}
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
          <ButtonLink to={doctorAgendaUrl()} variant="ghost" size="sm" className="-me-2">
            Ver tudo
          </ButtonLink>
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
                <TodayRow appointment={appointment} onView={() => onView(appointment)} />
              </li>
            </Fragment>
          ))}
          {nowAt === items.length && <NowLine now={now} />}
        </ul>
      )}
    </SectionCard>
  );
}
