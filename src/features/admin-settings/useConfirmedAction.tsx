import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ConfirmDialog } from '@components/ui';
import { usePendingMutation } from '@hooks/usePendingMutation';
import { ApiError } from '@lib/api/api-error';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';

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
  const refresh = () =>
    Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  const { mutation, pending, ask, close } = usePendingMutation({
    run,
    success,
    messages,
    onSuccess: refresh,
    onError: (error) => error instanceof ApiError && error.code === 'NOT_FOUND' && refresh(),
  });

  const confirmation = (
    <ConfirmDialog
      open={pending !== null}
      onClose={close}
      {...confirm(pending)}
      loading={mutation.isPending}
      onConfirm={() => pending !== null && mutation.mutate(pending)}
    />
  );

  const isBusy = (payload: P) =>
    mutation.isPending && mutation.variables !== undefined && keyOf(mutation.variables) === keyOf(payload);

  return {
    run: (payload: P) => mutation.mutate(payload),
    ask,
    isBusy,
    confirmation,
  };
}
