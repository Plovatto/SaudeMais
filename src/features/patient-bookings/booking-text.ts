import type { PatientBooking } from '@lib/api/models';

export const blockedNotes: Partial<
  Record<NonNullable<PatientBooking['actions']['cancelBlockedReason']>, string>
> = {
  started: 'Este agendamento já começou e não pode mais ser cancelado.',
};
