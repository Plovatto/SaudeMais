import type { PatientBooking } from '@lib/api/models';
import { formatDateTime } from '@lib/date';

export const blockedNotes: Partial<
  Record<NonNullable<PatientBooking['actions']['cancelBlockedReason']>, string>
> = {
  started: 'Este agendamento já começou e não pode mais ser cancelado.',
};

export function bookingSummary(booking: PatientBooking): string {
  const when = formatDateTime(booking.startsAt);
  return booking.kind === 'exam'
    ? `Exame ${booking.examType?.name ?? ''} em ${booking.unit.name}, ${when}.`
    : `Consulta de ${booking.specialty?.name ?? ''} com ${booking.doctor?.fullName ?? ''} em ${when}.`;
}
