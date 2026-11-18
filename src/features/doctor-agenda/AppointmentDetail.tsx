import { CloseButton } from '@components/ui';
import { sectionPad } from '@components/ui/styles';
import type { DoctorAppointment } from '@lib/api/models';
import { cx } from '@lib/cx';
import { AppointmentActions, AppointmentHeading, AppointmentInfo } from './AppointmentCard';
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
      <div className={cx('flex flex-col gap-[18px]', sectionPad)}>
        <div className="flex items-start gap-3">
          <h2 id={titleId} className="flex min-w-0 flex-1 items-start gap-3">
            <AppointmentHeading appointment={appointment} />
          </h2>
          {onClose && <CloseButton onClick={onClose} />}
        </div>
        <AppointmentInfo appointment={appointment} />
      </div>
      <AppointmentActions appointment={appointment} footer {...state} />
    </article>
  );
}
