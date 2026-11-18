import { useQueryClient } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { CancelBookingDialog } from '@components/bookings/CancelBookingDialog';
import { Drawer, DrawerBody } from '@components/ui';
import { visitTypeLabels } from '@constants/visit-types';
import { cancelAppointment } from '@lib/api/cancel-api';
import type { DoctorAppointment } from '@lib/api/models';
import { formatDateTime } from '@lib/date';
import { queryKeys } from '@lib/query-keys';
import { AppointmentActions, AppointmentHeading, AppointmentInfo } from './AppointmentCard';
import { nextTask, useDecisions } from './useDecisions';

const cancelCopy = (appointment: DoctorAppointment | null) =>
  appointment?.status === 'pending'
    ? { title: 'Recusar pedido?', confirmLabel: 'Recusar pedido', success: 'Pedido recusado.' }
    : { title: 'Cancelar consulta?' };

export function useAppointmentActions(fallbackFocus: RefObject<HTMLElement | null>) {
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<DoctorAppointment | null>(null);
  const [viewing, setViewing] = useState<DoctorAppointment | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.doctor.all });
  const decisions = useDecisions(refresh, fallbackFocus);
  const closeView = () => setViewing(null);

  return {
    busy: decisions.busy,
    pendingFor: decisions.pendingFor,
    decide: decisions.request,
    cancel: setCancelling,
    view: setViewing,
    dialogs: (
      <>
        <Drawer
          open={viewing !== null}
          onClose={closeView}
          title="Detalhes da consulta"
          fallbackFocus={fallbackFocus}
        >
          {viewing && (
            <DrawerBody>
              <div className="flex items-start gap-3">
                <AppointmentHeading appointment={viewing} />
              </div>
              <AppointmentInfo appointment={viewing} />
              <AppointmentActions
                appointment={viewing}
                pending={null}
                busy={decisions.busy}
                onDecide={(decision, appointment) => {
                  closeView();
                  void nextTask().then(() => decisions.request(decision, appointment));
                }}
                onCancel={(appointment) => {
                  closeView();
                  setCancelling(appointment);
                }}
              />
            </DrawerBody>
          )}
        </Drawer>
        <CancelBookingDialog
          target={cancelling}
          {...cancelCopy(cancelling)}
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
      </>
    ),
  };
}
