import type { PatientBooking } from '@lib/api/models';
import { plural } from '@lib/plural';

type RescheduleBlock = NonNullable<PatientBooking['actions']['rescheduleBlockedReason']>;

export const rescheduleBlockedNotes: Partial<Record<RescheduleBlock, string>> = {
  window_closed: 'Falta pouco para o horário: este agendamento não pode mais ser reagendado, só cancelado.',
  limit: 'Você já usou todos os reagendamentos deste agendamento. Ainda é possível cancelá-lo.',
};

export const RESCHEDULE_CLOSED_NOTE = 'Este agendamento não pode mais ser reagendado.';

export const reschedulesLeftText = (left: number) =>
  plural(left, 'reagendamento restante', 'reagendamentos restantes');
