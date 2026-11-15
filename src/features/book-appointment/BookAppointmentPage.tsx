import { LuCalendar } from 'react-icons/lu';
import { BookingPage } from '@components/booking-form/BookingPage';
import { formatDateTime } from '@lib/date';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment } from './booking-api';

const describe = ({ specialty, doctor, startsAt }: Appointment) =>
  `Consulta de ${specialty.name} com ${doctor.fullName} em ${formatDateTime(startsAt)}. Avisaremos quando o médico confirmar.`;

export function BookAppointmentPage() {
  return (
    <BookingPage<Appointment>
      title="Agendar consulta"
      subtitle="Preencha os dados para a sua consulta"
      icon={<LuCalendar />}
      bookedTitle="Pedido enviado, aguardando confirmação"
      describe={describe}
    >
      {(onBooked) => <AppointmentForm onBooked={onBooked} />}
    </BookingPage>
  );
}
