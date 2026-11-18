import { apiFetch } from '@lib/api/api-fetch';
import { ApiError } from '@lib/api/api-error';
import type { PatientBooking } from '@lib/api/models';

const PAGE_SIZE = 10;

export interface BookingListParams {
  scope: 'upcoming' | 'past';
  page: number;
  kind?: PatientBooking['kind'] | undefined;
  status?: PatientBooking['status'] | undefined;
}

export const listBookings = ({ scope, page, kind, status }: BookingListParams, signal: AbortSignal) =>
  apiFetch('get', '/api/patient/bookings', {
    query: { scope, page, pageSize: PAGE_SIZE, kind, status },
    signal,
  });

async function getAppointment(id: string, signal: AbortSignal): Promise<PatientBooking> {
  const appointment = await apiFetch('get', '/api/appointments/{id}', { params: { id }, signal });
  if (!appointment.patientActions) throw new ApiError(404, 'NOT_FOUND', '');
  return {
    id: appointment.id,
    kind: 'appointment',
    status: appointment.status,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    notes: appointment.notes,
    visitType: appointment.visitType,
    doctor: appointment.doctor,
    specialty: appointment.specialty,
    examType: null,
    publicCode: null,
    hasResult: false,
    unit: appointment.unit,
    cancellation: appointment.cancellation,
    actions: appointment.patientActions,
  };
}

async function getExamBooking(id: string, signal: AbortSignal): Promise<PatientBooking> {
  const exam = await apiFetch('get', '/api/exam-bookings/{id}', { params: { id }, signal });
  return {
    id: exam.id,
    kind: 'exam',
    status: exam.status,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt,
    notes: exam.notes,
    visitType: null,
    doctor: null,
    specialty: null,
    examType: { id: exam.examType.id, name: exam.examType.name },
    publicCode: exam.publicCode,
    hasResult: exam.hasResult,
    unit: exam.unit,
    cancellation: exam.cancellation,
    actions: exam.actions,
  };
}

export async function getBooking(id: string, signal: AbortSignal): Promise<PatientBooking> {
  try {
    return await getAppointment(id, signal);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
  return getExamBooking(id, signal);
}
