import { hasStarted } from '@components/bookings/booking-display';
import { RESULTS_WINDOW_DAYS } from '@constants/patient-results';
import type { DoctorAppointment } from '@lib/api/models';
import { DECISIONS } from './decisions';

const REVIEWABLE: ReadonlySet<DoctorAppointment['status']> = new Set(['confirmed', 'completed']);

const WINDOW_MS = RESULTS_WINDOW_DAYS * 86_400_000;

const canReviewResults = ({ visitType, status, startsAt }: DoctorAppointment, now = Date.now()) =>
  visitType === 'exam_review' &&
  REVIEWABLE.has(status) &&
  hasStarted(startsAt, now) &&
  now - new Date(startsAt).getTime() <= WINDOW_MS;

export const availableActions = (appointment: DoctorAppointment) => {
  const decisions = DECISIONS.filter(({ flag }) => appointment.actions[flag]);
  const reviewable = canReviewResults(appointment);
  return { decisions, reviewable, any: decisions.length > 0 || appointment.actions.canCancel || reviewable };
};
