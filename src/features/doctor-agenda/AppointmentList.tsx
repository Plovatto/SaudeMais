import { Fragment, type RefObject } from 'react';
import type { DoctorAppointment } from '@lib/api/models';
import { AppointmentCard } from './AppointmentCard';
import { groupByAppointmentDay } from './day-groups';
import { useAppointmentActions } from './useAppointmentActions';

export interface AppointmentListProps {
  items: DoctorAppointment[];
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function AppointmentList({ items, fallbackFocus }: AppointmentListProps) {
  const actions = useAppointmentActions(fallbackFocus);

  return (
    <div className="@container">
      <div className="grid items-start gap-3 @3xl:grid-cols-2">
        {groupByAppointmentDay(items).map(({ date, label, items: day }) => (
          <Fragment key={date}>
            <h2 className="text-text-secondary col-span-full text-sm font-medium not-first:mt-2">{label}</h2>
            <ul className="contents">
              {day.map((appointment) => (
                <li key={appointment.id}>
                  <AppointmentCard
                    appointment={appointment}
                    pending={actions.pendingFor(appointment.id)}
                    busy={actions.busy}
                    onDecide={actions.decide}
                    onCancel={actions.cancel}
                  />
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
      </div>
      {actions.dialogs}
    </div>
  );
}
