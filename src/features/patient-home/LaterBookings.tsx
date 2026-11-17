import { BookingRow } from '@components/bookings/BookingRow';
import { ButtonLink, SectionCard, Skeleton } from '@components/ui';
import { bookingUrl, PATIENT_BOOKINGS_PATH } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';

export interface LaterBookingsProps {
  items: PatientBooking[];
  pending: boolean;
  failed: boolean;
}

export function LaterBookings({ items, pending, failed }: LaterBookingsProps) {
  return (
    <SectionCard
      title="Depois disso"
      flush
      aria-busy={pending}
      action={
        <ButtonLink to={PATIENT_BOOKINGS_PATH} variant="ghost" size="sm" className="-me-2">
          Ver todos
        </ButtonLink>
      }
    >
      {pending ? (
        <div className="flex flex-col gap-3 p-4 lg:p-5">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : failed || items.length === 0 ? (
        <p className="text-text-muted px-4 py-6 text-center text-[0.8125rem] lg:px-5">
          {failed ? 'Não foi possível carregar os agendamentos.' : 'Nada mais agendado.'}
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {items.map((booking) => (
            <li key={booking.id}>
              <BookingRow booking={booking} to={bookingUrl(booking.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
