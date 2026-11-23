import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@components/ui';
import { errorMessage, type MessageOverrides } from '@lib/messages/errors.pt-BR';

export interface PendingMutationOptions<P, R> {
  run: (payload: P) => Promise<R>;
  success: (payload: P, result: R) => string;
  messages: MessageOverrides;
  onSuccess?: (result: R, payload: P) => unknown;
  onError?: (error: unknown, payload: P) => unknown;
}

export function usePendingMutation<P, R>({
  run,
  success,
  messages,
  onSuccess,
  onError,
}: PendingMutationOptions<P, R>) {
  const { show } = useToast();
  const [pending, setPending] = useState<P | null>(null);
  const mutation = useMutation({
    mutationFn: run,
    onSuccess: async (result, payload) => {
      await onSuccess?.(result, payload);
      show({ message: success(payload, result), tone: 'success' });
    },
    onError: (error, payload) => {
      show({ message: errorMessage(error, messages), tone: 'danger' });
      void onError?.(error, payload);
    },
    onSettled: () => setPending(null),
  });

  return {
    mutation,
    pending,
    ask: (payload: P) => setPending(() => payload),
    close: () => setPending(null),
  };
}
