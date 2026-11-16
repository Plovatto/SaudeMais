import { useMutation } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { isStale, staleMessages } from '@components/bookings/stale-appointment';
import { ConfirmDialog, useToast } from '@components/ui';
import type { DoctorAppointment } from '@lib/api/models';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import type { Decision } from './decisions';

const nextTask = () => new Promise((resolve) => setTimeout(resolve));

interface Request {
  decision: Decision;
  appointment: DoctorAppointment;
}

export function useDecisions(refresh: () => Promise<unknown>, fallbackFocus: RefObject<HTMLElement | null>) {
  const { show } = useToast();
  const [asking, setAsking] = useState<Request | null>(null);
  const settle = async (trigger: Element | null | undefined) => {
    await refresh();
    await nextTask();
    if (trigger && !trigger.isConnected) fallbackFocus.current?.focus();
  };
  const mutation = useMutation({
    mutationFn: ({ decision, appointment }: Request) => decision.send(appointment),
    onMutate: () => document.activeElement,
    onSuccess: async (_data, { decision }, trigger) => {
      show({ message: decision.success, tone: 'success' });
      await settle(trigger);
    },
    onError: async (error, _request, trigger) => {
      show({ message: errorMessage(error, staleMessages), tone: 'danger' });
      if (isStale(error)) await settle(trigger);
    },
  });
  const run = (request: Request) => mutation.mutate(request, { onSettled: () => setAsking(null) });
  const confirmation = asking?.decision.confirmation;
  return {
    busy: mutation.isPending,
    pendingFor: (id: string) =>
      mutation.isPending && mutation.variables.appointment.id === id ? mutation.variables.decision : null,
    request: (decision: Decision, appointment: DoctorAppointment) =>
      decision.confirmation ? setAsking({ decision, appointment }) : run({ decision, appointment }),
    dialog: (
      <ConfirmDialog
        open={asking !== null}
        title={confirmation?.title ?? ''}
        description={asking && confirmation?.description(asking.appointment)}
        confirmLabel={confirmation?.confirmLabel ?? ''}
        loading={mutation.isPending}
        onConfirm={() => asking && run(asking)}
        onClose={() => setAsking(null)}
        fallbackFocus={fallbackFocus}
      />
    ),
  };
}
