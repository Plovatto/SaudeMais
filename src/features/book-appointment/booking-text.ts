import { formatDateTime } from '@lib/date';
import type { Appointment } from './booking-api';

export const describeAppointment = ({ specialty, doctor, startsAt }: Appointment) =>
  `Consulta de ${specialty.name} com ${doctor.fullName} em ${formatDateTime(startsAt)}. Avisaremos quando o médico confirmar.`;
