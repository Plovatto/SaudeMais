import { BookingRow } from '@components/bookings/BookingRow';
import { ListPlaceholder, SectionCard, SectionLink } from '@components/ui';
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
      action={<SectionLink to={PATIENT_BOOKINGS_PATH}>Ver todos</SectionLink>}
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
