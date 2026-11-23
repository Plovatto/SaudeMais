import type { PatientBooking } from '@lib/api/models';
import { FUTURE } from './doctor-fixtures';

export const actions = (overrides: Partial<PatientBooking['actions']> = {}): PatientBooking['actions'] => ({
  canCancel: true,
  lateCancellation: false,
  cancelBlockedReason: null,
  canReschedule: true,
  rescheduleBlockedReason: null,
  reschedulesLeft: 2,
  ...overrides,
});

export const booking = (id: string, overrides: Partial<PatientBooking> = {}): PatientBooking => ({
  id,
  kind: 'appointment',
  status: 'confirmed',
  startsAt: FUTURE,
  endsAt: '2030-01-10T13:30:00.000Z',
  notes: null,
  visitType: 'routine',
  doctor: { id: 'd1', fullName: 'Dr. João Silveira' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  examType: null,
  publicCode: null,
  unit: { id: 'u1', name: 'Hospital Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
  actions: actions(),
  cancellation: null,
  hasResult: false,
  ...overrides,
});

export const unit = (overrides: Partial<PatientBooking['unit']> = {}): PatientBooking['unit'] => ({
  id: 'u1',
  name: 'Unidade Central',
  address: 'Rua das Flores, 123',
  phone: '+551133334444',
  ...overrides,
});

export const patientAppointment = (overrides: Record<string, unknown> = {}) => ({
  id: 'a1',
  status: 'pending',
  visitType: 'routine',
  startsAt: '2026-11-23T17:30:00.000Z',
  endsAt: '2026-11-23T18:00:00.000Z',
  notes: null,
  patient: { id: 'p1', fullName: 'Ana Maria Silva' },
  doctor: { id: 'd1', fullName: 'Carlos Mendes' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  unit: unit(),
  createdAt: '2026-11-14T12:00:00.000Z',
  events: [],
  ...overrides,
});
