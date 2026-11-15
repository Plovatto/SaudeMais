import { LuCalendar } from 'react-icons/lu';
import { BookingPage } from '@components/booking-form/BookingPage';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment } from './booking-api';
import { describeAppointment } from './booking-text';

export function BookAppointmentPage() {
  return (
    <BookingPage<Appointment>
      title="Agendar consulta"
      subtitle="Preencha os dados para a sua consulta"
      icon={<LuCalendar />}
      bookedTitle="Pedido enviado, aguardando confirmação"
      describe={describeAppointment}
    >
      {(onBooked) => <AppointmentForm onBooked={onBooked} />}
    </BookingPage>
  );
}
