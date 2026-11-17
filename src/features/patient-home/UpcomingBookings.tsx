import type { UseQueryResult } from '@tanstack/react-query';
import { LuCalendarX } from 'react-icons/lu';
import { UPCOMING_EMPTY } from '@components/bookings/booking-display';
import { BookingHeadline } from '@components/bookings/BookingHeadline';
import { ButtonLink, Card, EmptyState, QueryError, SectionCard, Skeleton } from '@components/ui';
import { PATIENT_BOOKINGS_PATH } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';

export interface UpcomingBookingsProps {
  query: UseQueryResult<{ upcoming: PatientBooking[] }>;
  className?: string;
}

export function UpcomingBookings({ query, className }: UpcomingBookingsProps) {
  const items = query.data?.upcoming;

  return (
    <SectionCard
      title="Próximos agendamentos"
      aria-busy={query.isPending}
      className={className}
      action={
        <ButtonLink
          to={PATIENT_BOOKINGS_PATH}
          aria-label="Ver todos os agendamentos"
          className="rounded-full px-4 text-sm"
        >
          Ver todos
        </ButtonLink>
      }
    >
      {query.isPending && (
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      )}
      {query.isError && <QueryError error={query.error} onRetry={() => void query.refetch()} />}
      {items?.length === 0 && <EmptyState icon={<LuCalendarX />} {...UPCOMING_EMPTY} className="py-6" />}
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
    </SectionCard>
  );
}
