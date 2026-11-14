import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { CancelAppointmentDialog } from '@components/bookings/CancelAppointmentDialog';
import { isStale, staleMessages } from '@components/bookings/stale-appointment';
import { useToast } from '@components/ui';
import { visitTypeLabels } from '@constants/visit-types';
import { formatDateTime } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { AppointmentCard } from './AppointmentCard';
import { groupByDay } from './day-groups';
import type { DoctorAppointment } from '@lib/api/models';
import { doctorApi } from './doctor-api';

const GRID = 'grid items-start gap-3 @3xl:grid-cols-2';

export interface AppointmentListProps {
  items: DoctorAppointment[];
  grouped?: boolean;
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function AppointmentList({ items, grouped = false, fallbackFocus }: AppointmentListProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const [cancelling, setCancelling] = useState<DoctorAppointment | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.doctor.all });
  const confirm = useMutation({
    mutationFn: doctorApi.confirm,
    onSuccess: async () => {
      show({ message: 'Consulta confirmada.', tone: 'success' });
      await refresh();
    },
    onError: (error) => {
      show({ message: errorMessage(error, staleMessages), tone: 'danger' });
      if (isStale(error)) void refresh();
    },
  });

  const renderItems = (list: DoctorAppointment[]) => (
    <ul className={GRID}>
      {list.map((appointment) => (
        <li key={appointment.id}>
          <AppointmentCard
            appointment={appointment}
            confirming={confirm.isPending && confirm.variables.id === appointment.id}
            onConfirm={(target) => confirm.mutate(target)}
            onCancel={setCancelling}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="@container">
      {grouped ? (
        <div className="flex flex-col gap-5">
          {groupByDay(items).map(({ date, label, items: day }) => (
            <section key={date} className="flex flex-col gap-3">
              <h2 className="text-text-secondary text-sm font-medium">{label}</h2>
              {renderItems(day)}
            </section>
          ))}
        </div>
      ) : (
        renderItems(items)
      )}
      <CancelAppointmentDialog
        target={cancelling}
        title="Cancelar consulta?"
        summary={
          cancelling
            ? `${visitTypeLabels[cancelling.visitType]} com ${cancelling.patient.fullName} em ${formatDateTime(cancelling.startsAt)}.`
            : undefined
        }
        reasonRequired
        refresh={refresh}
        onClose={() => setCancelling(null)}
        fallbackFocus={fallbackFocus}
      />
    </div>
  );
}
