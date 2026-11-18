import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@components/ui';
import type { DoctorAppointment } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import type { Decision } from './decisions';

export interface DecisionState {
  pending: Decision | null;
  busy: boolean;
  onDecide: (decision: Decision, appointment: DoctorAppointment) => void;
}

export function ActionTarget({ appointment }: { appointment: DoctorAppointment }) {
  return (
    <span className="sr-only">
      : {appointment.patient.fullName}, {formatDateTime(appointment.startsAt)}
    </span>
  );
}

export interface DecisionButtonProps extends DecisionState, Pick<ButtonProps, 'variant' | 'size'> {
  decision: Decision;
  appointment: DoctorAppointment;
  icon?: ReactNode;
}

export function DecisionButton({
  decision,
  appointment,
  pending,
  busy,
  onDecide,
  variant = decision.variant,
  size,
  icon = decision.icon,
}: DecisionButtonProps) {
  if (!appointment.actions[decision.flag]) return null;
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      loading={pending === decision}
      disabled={busy && pending !== decision}
      loadingLabel={decision.loadingLabel}
      onClick={() => onDecide(decision, appointment)}
    >
      {decision.label}
      <ActionTarget appointment={appointment} />
    </Button>
  );
}
