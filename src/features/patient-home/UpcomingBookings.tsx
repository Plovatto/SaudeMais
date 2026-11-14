import type { UseQueryResult } from '@tanstack/react-query';
import { LuCalendarX } from 'react-icons/lu';
import { BookingHeadline } from '@components/bookings/BookingHeadline';
import { ButtonLink, Card, EmptyState, QueryError, Skeleton } from '@components/ui';
import { areas } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';

const TITLE_ID = 'upcoming-bookings-title';

export interface UpcomingBookingsProps {
  query: UseQueryResult<{ upcoming: PatientBooking[] }>;
  className?: string;
}

export function UpcomingBookings({ query, className }: UpcomingBookingsProps) {
  const items = query.data?.upcoming;

  return (
    <section aria-labelledby={TITLE_ID} className={className}>
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={TITLE_ID} className="text-text text-lg font-semibold">
            Próximos agendamentos
          </h2>
          <ButtonLink
            to={`${areas.patient.base}/agendamentos`}
            aria-label="Ver todos os agendamentos"
            className="rounded-full px-4 text-sm"
          >
            Ver todos
          </ButtonLink>
        </div>
        {query.isPending && (
          <div aria-busy="true" className="grid gap-3 lg:grid-cols-2">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        )}
        {query.isError && <QueryError error={query.error} onRetry={() => void query.refetch()} />}
        {items?.length === 0 && (
          <EmptyState
            icon={<LuCalendarX />}
            title="Nenhum agendamento futuro"
            description="Use os botões acima para agendar uma consulta ou um exame."
            className="py-6"
          />
        )}
        {items && items.length > 0 && (
          <ul className={cx('grid items-start gap-3', items.length > 1 && 'lg:grid-cols-2')}>
            {items.map((booking) => (
              <li key={booking.id}>
                <Card variant="outlined" className="flex items-start gap-3">
                  <BookingHeadline booking={booking} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
