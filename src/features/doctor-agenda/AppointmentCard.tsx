import { LuCircleX, LuClock, LuFileText, LuMapPin, LuPhone } from 'react-icons/lu';
import { CancellationNote, Note, PhoneLink } from '@components/bookings/BookingDetails';
import { bookingStatus, hasStarted } from '@components/bookings/booking-display';
import { DateTile } from '@components/bookings/DateTile';
import { Button, ButtonLink, InfoList, StatusChip } from '@components/ui';
import { footerBar } from '@components/ui/styles';
import { resultsLink } from '@constants/patient-results';
import { visitTypeLabels } from '@constants/visit-types';
import type { DoctorAppointment } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatDuration, formatLongDay, formatTime } from '@lib/date';
import { availableActions } from './appointment-actions';
import { ActionTarget, DecisionButton, type DecisionState } from './DecisionButton';

export interface AppointmentActionsProps extends DecisionState {
  appointment: DoctorAppointment;
  onCancel: (appointment: DoctorAppointment) => void;
  footer?: boolean;
}

export function AppointmentStatus({
  appointment,
  className,
}: {
  appointment: DoctorAppointment;
  className?: string;
}) {
  const status = bookingStatus(appointment, 'doctor');
  return (
    <StatusChip tone={status.tone} icon={status.icon} className={className}>
      {status.label}
    </StatusChip>
  );
}

interface AppointmentHeadingProps {
  appointment: DoctorAppointment;
  titleId?: string;
  withStatus?: boolean;
}

export function AppointmentHeading({ appointment, titleId, withStatus = true }: AppointmentHeadingProps) {
  const Title = titleId ? 'h2' : 'p';
  return (
    <div className="border-border flex items-center gap-4 border-b pb-[18px]">
      <DateTile startsAt={appointment.startsAt} size="lg" muted={hasStarted(appointment.startsAt)} />
      <div className="flex min-w-0 flex-col items-start">
        {withStatus && <AppointmentStatus appointment={appointment} className="mb-2" />}
        <Title
          id={titleId}
          className="text-text text-xl leading-tight font-bold tracking-[-0.02em] text-balance break-words"
        >
          {appointment.patient.fullName}
        </Title>
        <p className="text-text-secondary mt-1 text-sm">{visitTypeLabels[appointment.visitType]}</p>
      </div>
    </div>
  );
}

export function AppointmentInfo({ appointment }: { appointment: DoctorAppointment }) {
  const { patient, unit, notes, cancellation, startsAt, endsAt } = appointment;
  return (
    <>
      <InfoList
        items={[
          {
            key: 'when',
            icon: <LuClock />,
            label: 'Quando',
            boxed: false,
            value: formatLongDay(startsAt),
            hint: (
              <span className="tabular-nums">{`${formatTime(startsAt)} · ${formatDuration(startsAt, endsAt)}`}</span>
            ),
          },
          {
            key: 'phone',
            icon: <LuPhone />,
            label: 'Telefone do paciente',
            boxed: false,
            value: patient.phone ? (
              <PhoneLink phone={patient.phone} />
            ) : (
              <span className="text-text-muted font-normal">Não informado</span>
            ),
          },
          {
            key: 'unit',
            icon: <LuMapPin />,
            label: 'Local',
            boxed: false,
            value: unit.name,
            hint: unit.address,
          },
        ]}
      />
      {(notes || cancellation) && (
        <dl className="flex flex-col gap-3 text-sm">
          {notes && <Note label="Observações do paciente">{notes}</Note>}
          {cancellation && <CancellationNote cancellation={cancellation} viewer="doctor" />}
        </dl>
      )}
    </>
  );
}

export function AppointmentActions({
  appointment,
  onCancel,
  footer = false,
  ...state
}: AppointmentActionsProps) {
  const { actions, patient } = appointment;
  const { decisions, reviewable, any } = availableActions(appointment);
  if (!any) return null;

  const Wrapper = footer ? 'footer' : 'div';
  return (
    <Wrapper
      className={cx(
        'flex flex-wrap gap-3 *:min-w-fit *:flex-1',
        footer && cx(footerBar, 'px-4 py-4 lg:px-5'),
      )}
    >
      {decisions.map((decision) => (
        <DecisionButton key={decision.flag} decision={decision} appointment={appointment} {...state} />
      ))}
      {actions.canCancel && (
        <Button variant="danger-outline" icon={<LuCircleX />} onClick={() => onCancel(appointment)}>
          {appointment.status === 'pending' ? 'Recusar' : 'Cancelar consulta'}
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
    </Wrapper>
  );
}
