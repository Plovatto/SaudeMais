import { LuCircleX, LuFileText, LuMapPin, LuPhone } from 'react-icons/lu';
import { AppointmentHeadline } from '@components/bookings/AppointmentHeadline';
import { CancellationNote, Detail, Note, PhoneLink } from '@components/bookings/BookingDetails';
import { bookingStatus, hasStarted } from '@components/bookings/booking-display';
import { ExpandableCard } from '@components/bookings/ExpandableCard';
import { Button, ButtonLink } from '@components/ui';
import { areas } from '@constants/areas';
import { RESULTS_WINDOW_DAYS, resultsLink } from '@constants/patient-results';
import { visitTypeLabels } from '@constants/visit-types';
import type { DoctorAppointment } from '@lib/api/models';
import { DECISIONS } from './decisions';
import { ActionTarget, DecisionButton, type DecisionState } from './DecisionButton';

const PatientIcon = areas.patient.icon;

const REVIEWABLE: ReadonlySet<DoctorAppointment['status']> = new Set(['confirmed', 'completed']);

const WINDOW_MS = RESULTS_WINDOW_DAYS * 86_400_000;

const canReviewResults = ({ visitType, status, startsAt }: DoctorAppointment, now = Date.now()) =>
  visitType === 'exam_review' &&
  REVIEWABLE.has(status) &&
  hasStarted(startsAt, now) &&
  now - new Date(startsAt).getTime() <= WINDOW_MS;

export interface AppointmentActionsProps extends DecisionState {
  appointment: DoctorAppointment;
  onCancel: (appointment: DoctorAppointment) => void;
}

export function AppointmentHeading({ appointment }: { appointment: DoctorAppointment }) {
  return (
    <AppointmentHeadline
      iconRole="patient"
      icon={<PatientIcon />}
      title={appointment.patient.fullName}
      subtitle={visitTypeLabels[appointment.visitType]}
      startsAt={appointment.startsAt}
      status={bookingStatus(appointment, 'doctor')}
    />
  );
}

export function AppointmentInfo({ appointment }: { appointment: DoctorAppointment }) {
  const { patient, unit, notes, cancellation } = appointment;
  return (
    <dl className="text-text-secondary flex flex-col gap-3 text-sm">
      <Detail icon={<LuPhone />} label="Telefone do paciente">
        {patient.phone ? <PhoneLink phone={patient.phone} /> : 'Telefone indisponível'}
      </Detail>
      <Detail icon={<LuMapPin />} label="Local">
        <span className="text-text block font-medium">{unit.name}</span>
        {unit.address}
      </Detail>
      {notes && <Note label="Observações do paciente">{notes}</Note>}
      {cancellation && <CancellationNote cancellation={cancellation} viewer="doctor" />}
    </dl>
  );
}

export function AppointmentActions({ appointment, onCancel, ...state }: AppointmentActionsProps) {
  const { actions, patient } = appointment;
  const decisions = DECISIONS.filter(({ flag }) => actions[flag]);
  const reviewable = canReviewResults(appointment);
  if (decisions.length === 0 && !actions.canCancel && !reviewable) return null;

  return (
    <div className="flex flex-wrap gap-3 *:min-w-fit *:flex-1">
      {decisions.map((decision) => (
        <DecisionButton key={decision.flag} decision={decision} appointment={appointment} {...state} />
      ))}
      {actions.canCancel && (
        <Button variant="danger-outline" icon={<LuCircleX />} onClick={() => onCancel(appointment)}>
          Cancelar
          <ActionTarget appointment={appointment} />
        </Button>
      )}
      {reviewable && (
        <ButtonLink {...resultsLink(patient)} variant="secondary">
          <LuFileText aria-hidden />
          Ver exames do paciente
          <ActionTarget appointment={appointment} />
        </ButtonLink>
      )}
    </div>
  );
}

export function AppointmentCard(props: AppointmentActionsProps) {
  return (
    <ExpandableCard
      headingLevel={3}
      headline={<AppointmentHeading appointment={props.appointment} />}
      actions={<AppointmentActions {...props} />}
    >
      <AppointmentInfo appointment={props.appointment} />
    </ExpandableCard>
  );
}
