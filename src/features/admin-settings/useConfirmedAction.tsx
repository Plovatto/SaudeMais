import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog, useToast } from '@components/ui';
import { ApiError } from '@lib/api/api-error';
import { errorMessage, type MessageOverrides } from '@lib/messages/errors.pt-BR';

export interface ConfirmedActionOptions<P> {
  keyOf: (payload: P) => string;
  run: (payload: P) => Promise<unknown>;
  invalidate: readonly QueryKey[];
  success: (payload: P) => string;
  confirm: (payload: P | null) => { title: string; description: string; confirmLabel: string };
  messages: MessageOverrides;
}

export function useConfirmedAction<P>({
  keyOf,
  run,
  invalidate,
  success,
  confirm,
  messages,
}: ConfirmedActionOptions<P>) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const [pending, setPending] = useState<P | null>(null);
  const refresh = () =>
    Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  const mutation = useMutation({
    mutationFn: run,
    onSuccess: async (_result, payload) => {
      await refresh();
      show({ message: success(payload), tone: 'success' });
    },
    onError: (error) => {
      show({ message: errorMessage(error, messages), tone: 'danger' });
      if (error instanceof ApiError && error.code === 'NOT_FOUND') void refresh();
    },
    onSettled: () => setPending(null),
  });

  const confirmation = (
    <ConfirmDialog
      open={pending !== null}
      onClose={() => setPending(null)}
      {...confirm(pending)}
      loading={mutation.isPending}
      onConfirm={() => pending !== null && mutation.mutate(pending)}
    />
  );

  const isBusy = (payload: P) =>
    mutation.isPending && mutation.variables !== undefined && keyOf(mutation.variables) === keyOf(payload);

  return {
    run: (payload: P) => mutation.mutate(payload),
    ask: (payload: P) => setPending(() => payload),
    isBusy,
    confirmation,
  };
}
