import { useMutation } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { isStale, staleMessages } from '@components/bookings/stale-appointment';
import { ConfirmDialog, useToast } from '@components/ui';
import type { DoctorAppointment, HealthMetricsInput } from '@lib/api/models';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { CompleteDialog } from './CompleteDialog';
import type { Decision } from './decisions';

const nextTask = () => new Promise((resolve) => setTimeout(resolve));

interface Request {
  decision: Decision;
  appointment: DoctorAppointment;
  metrics?: HealthMetricsInput | undefined;
}

export function useDecisions(refresh: () => Promise<unknown>, fallbackFocus: RefObject<HTMLElement | null>) {
  const { show } = useToast();
  const [asking, setAsking] = useState<Request | null>(null);
  const close = () => setAsking(null);
  const settle = async (trigger: Element | null | undefined) => {
    await refresh();
    await nextTask();
    if (trigger && !trigger.isConnected) fallbackFocus.current?.focus();
  };
  const mutation = useMutation({
    mutationFn: ({ decision, appointment, metrics }: Request) => decision.send(appointment, metrics),
    onMutate: () => document.activeElement,
    onSuccess: async (_data, { decision }, trigger) => {
      show({ message: decision.success, tone: 'success' });
      await settle(trigger);
    },
    onError: async (error, { decision }, trigger) => {
      const stale = isStale(error);
      if (decision.recordsMetrics && !stale) return;
      show({ message: errorMessage(error, staleMessages), tone: 'danger' });
      if (stale) await settle(trigger);
    },
  });
  const run = (request: Request) => mutation.mutate(request, { onSettled: close });
  const complete = async (metrics: HealthMetricsInput | undefined) => {
    if (!asking) return;
    await mutation.mutateAsync({ ...asking, metrics });
    close();
  };
  const confirmation = asking?.decision.confirmation;
  return {
    busy: mutation.isPending,
    pendingFor: (id: string) =>
      mutation.isPending && mutation.variables.appointment.id === id ? mutation.variables.decision : null,
    request: (decision: Decision, appointment: DoctorAppointment) =>
      decision.confirmation || decision.recordsMetrics
        ? setAsking({ decision, appointment })
        : run({ decision, appointment }),
    dialog: (
      <>
        <ConfirmDialog
          open={confirmation !== undefined}
          title={confirmation?.title ?? ''}
          description={asking && confirmation?.description(asking.appointment)}
          confirmLabel={confirmation?.confirmLabel ?? ''}
          loading={mutation.isPending}
          onConfirm={() => asking && run(asking)}
          onClose={close}
          fallbackFocus={fallbackFocus}
        />
        <CompleteDialog
          appointment={asking?.decision.recordsMetrics ? asking.appointment : null}
          loading={mutation.isPending}
          onSubmit={complete}
          onClose={close}
          fallbackFocus={fallbackFocus}
        />
      </>
    ),
  };
}
