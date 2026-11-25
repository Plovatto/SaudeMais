import { CloseButton } from '@components/ui';
import { headerBar } from '@components/ui/styles';
import type { DoctorAppointment } from '@lib/api/models';
import { cx } from '@lib/cx';
import {
  AppointmentActions,
  AppointmentHeading,
  AppointmentInfo,
  AppointmentStatus,
} from './AppointmentCard';
import type { DecisionState } from './DecisionButton';

export interface AppointmentDetailProps extends DecisionState {
  appointment: DoctorAppointment;
  titleId: string;
  onCancel: (appointment: DoctorAppointment) => void;
  onClose?: () => void;
}

export function AppointmentDetail({ appointment, titleId, onClose, ...state }: AppointmentDetailProps) {
  return (
    <article aria-labelledby={titleId} className="flex flex-col">
      <header className={cx(headerBar, 'py-3.5')}>
        <AppointmentStatus appointment={appointment} />
        <span className="flex-1" />
        {onClose && <CloseButton onClick={onClose} />}
      </header>
      <div className="flex flex-col gap-[18px] px-4 pb-5 lg:px-5">
        <AppointmentHeading appointment={appointment} titleId={titleId} withStatus={false} />
        <AppointmentInfo appointment={appointment} />
      </div>
      <AppointmentActions appointment={appointment} footer {...state} />
    </article>
  );
}
