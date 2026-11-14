import { LuStethoscope, LuSyringe } from 'react-icons/lu';
import type { PatientBooking } from '@lib/api/models';
import { AppointmentHeadline } from './AppointmentHeadline';
import { bookingStatus, bookingTitle } from './booking-display';

export function BookingHeadline({ booking }: { booking: PatientBooking }) {
  return (
    <AppointmentHeadline
      iconRole="doctor"
      icon={booking.kind === 'exam' ? <LuSyringe /> : <LuStethoscope />}
      {...bookingTitle(booking)}
      startsAt={booking.startsAt}
      status={bookingStatus(booking, 'patient')}
    />
  );
}
