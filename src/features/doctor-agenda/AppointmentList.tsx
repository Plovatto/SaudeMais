import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useState, type RefObject } from 'react';
import { CancelBookingDialog } from '@components/bookings/CancelBookingDialog';
import { visitTypeLabels } from '@constants/visit-types';
import { cancelAppointment } from '@lib/api/cancel-api';
import type { DoctorAppointment } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { AppointmentCard } from './AppointmentCard';
import { groupByAppointmentDay } from './day-groups';
import { useDecisions } from './useDecisions';

const GRID = 'grid items-start gap-3 @3xl:grid-cols-2';

export interface AppointmentListProps {
  items: DoctorAppointment[];
  grouped?: boolean;
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function AppointmentList({ items, grouped = false, fallbackFocus }: AppointmentListProps) {
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<DoctorAppointment | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.doctor.all });
  const decisions = useDecisions(refresh, fallbackFocus);

  const cards = (list: DoctorAppointment[]) =>
    list.map((appointment) => (
      <li key={appointment.id}>
        <AppointmentCard
          appointment={appointment}
          pending={decisions.pendingFor(appointment.id)}
          busy={decisions.busy}
          onDecide={decisions.request}
          onCancel={setCancelling}
        />
      </li>
    ));

  return (
    <div className="@container">
      {grouped ? (
        <div className={GRID}>
          {groupByAppointmentDay(items).map(({ date, label, items: day }) => (
            <Fragment key={date}>
              <h2 className="text-text-secondary col-span-full text-sm font-medium not-first:mt-2">
                {label}
              </h2>
              <ul className="contents">{cards(day)}</ul>
            </Fragment>
          ))}
        </div>
      ) : (
        <ul className={GRID}>{cards(items)}</ul>
      )}
      <CancelBookingDialog
        target={cancelling}
        title="Cancelar consulta?"
        summary={
          cancelling
            ? `${visitTypeLabels[cancelling.visitType]} com ${cancelling.patient.fullName} em ${formatDateTime(cancelling.startsAt)}.`
            : undefined
        }
        reason="required"
        cancel={cancelAppointment}
        refresh={refresh}
        onClose={() => setCancelling(null)}
        fallbackFocus={fallbackFocus}
      />
      {decisions.dialog}
    </div>
  );
}
