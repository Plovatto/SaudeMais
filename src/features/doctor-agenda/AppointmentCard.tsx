import { LuCircleX, LuFileText, LuMapPin, LuPhone } from 'react-icons/lu';
import { AppointmentHeadline } from '@components/bookings/AppointmentHeadline';
import { CancellationNote, Detail, Note, PhoneLink } from '@components/bookings/BookingDetails';
import { bookingStatus } from '@components/bookings/booking-display';
import { ExpandableCard } from '@components/bookings/ExpandableCard';
import { Button, ButtonLink } from '@components/ui';
import { areas } from '@constants/areas';
import { visitTypeLabels } from '@constants/visit-types';
import { resultsLink } from '@features/patient-results/results-link';
import { formatDateTime } from '@lib/date';
import type { DoctorAppointment } from '@lib/api/models';
import { DECISIONS, type Decision } from './decisions';

const PatientIcon = areas.patient.icon;

const REVIEWABLE: ReadonlySet<DoctorAppointment['status']> = new Set(['confirmed', 'completed']);

const canReviewResults = ({ visitType, status, startsAt }: DoctorAppointment) =>
  visitType === 'exam_review' && REVIEWABLE.has(status) && new Date(startsAt).getTime() <= Date.now();

export interface AppointmentCardProps {
  appointment: DoctorAppointment;
  pending: Decision | null;
  busy: boolean;
  onDecide: (decision: Decision, appointment: DoctorAppointment) => void;
  onCancel: (appointment: DoctorAppointment) => void;
}

export function AppointmentCard({ appointment, pending, busy, onDecide, onCancel }: AppointmentCardProps) {
  const { patient, unit, notes, cancellation, actions, startsAt } = appointment;
  const target = (
    <span className="sr-only">
      : {patient.fullName}, {formatDateTime(startsAt)}
    </span>
  );
  const decisions = DECISIONS.filter(({ flag }) => actions[flag]);
  const reviewable = canReviewResults(appointment);

  return (
    <ExpandableCard
      headingLevel={3}
      headline={
        <AppointmentHeadline
          iconRole="patient"
          icon={<PatientIcon />}
          title={patient.fullName}
          subtitle={visitTypeLabels[appointment.visitType]}
          startsAt={startsAt}
          status={bookingStatus(appointment, 'doctor')}
        />
      }
      actions={
        (decisions.length > 0 || actions.canCancel || reviewable) && (
          <div className="flex flex-wrap gap-3 *:min-w-fit *:flex-1">
            {decisions.map((decision) => (
              <Button
                key={decision.flag}
                variant={decision.variant}
                icon={decision.icon}
                loading={pending === decision}
                disabled={busy && pending !== decision}
                loadingLabel={decision.loadingLabel}
                onClick={() => onDecide(decision, appointment)}
              >
                {decision.label}
                {target}
              </Button>
            ))}
            {actions.canCancel && (
              <Button variant="danger-outline" icon={<LuCircleX />} onClick={() => onCancel(appointment)}>
                Cancelar
                {target}
              </Button>
            )}
            {reviewable && (
              <ButtonLink {...resultsLink(patient)} variant="secondary">
                <LuFileText aria-hidden />
                Ver exames do paciente
                {target}
              </ButtonLink>
            )}
          </div>
        )
      }
    >
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
    </ExpandableCard>
  );
}
