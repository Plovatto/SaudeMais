import { useBookedRedirect } from '@components/booking-form/useBookedRedirect';
import { AppointmentForm } from './AppointmentForm';

export function BookAppointmentPage() {
  const onBooked = useBookedRedirect(() => 'Pedido enviado. Avisaremos quando o médico confirmar.');
  return <AppointmentForm onBooked={onBooked} />;
}
