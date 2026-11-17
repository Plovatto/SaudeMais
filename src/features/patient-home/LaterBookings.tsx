import { BookingRow } from '@components/bookings/BookingRow';
import { ButtonLink, ListPlaceholder, SectionCard } from '@components/ui';
import { bookingUrl, PATIENT_BOOKINGS_PATH } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';

export interface LaterBookingsProps {
  items: PatientBooking[] | undefined;
  pending: boolean;
}

export function LaterBookings({ items, pending }: LaterBookingsProps) {
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
      {items?.length ? (
        <ul className="divide-border divide-y">
          {items.map((booking) => (
            <li key={booking.id}>
              <BookingRow booking={booking} to={bookingUrl(booking.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <ListPlaceholder
          pending={pending}
          message={items ? 'Nada mais agendado.' : 'Não foi possível carregar os agendamentos.'}
        />
      )}
    </SectionCard>
  );
}
