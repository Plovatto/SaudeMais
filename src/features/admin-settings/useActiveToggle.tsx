import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Dialog, useToast } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { catalogMessages } from './catalog-messages';

export interface ActiveToggleOptions<T> {
  nameOf: (item: T) => string;
  keyOf: (item: T) => string;
  setActive: (item: T, isActive: boolean) => Promise<unknown>;
  invalidate: QueryKey;
}

export function useActiveToggle<T>({ nameOf, keyOf, setActive, invalidate }: ActiveToggleOptions<T>) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const [pending, setPending] = useState<T | null>(null);
  const mutation = useMutation({
    mutationFn: ({ item, isActive }: { item: T; isActive: boolean }) => setActive(item, isActive),
    onSuccess: async (_result, { item, isActive }) => {
      await queryClient.invalidateQueries({ queryKey: invalidate });
      show({ message: `${nameOf(item)} ${isActive ? 'ativado' : 'desativado'}.`, tone: 'success' });
    },
    onError: (error) => show({ message: errorMessage(error, catalogMessages), tone: 'danger' }),
    onSettled: () => setPending(null),
  });

  const request = (item: T, isActive: boolean) => {
    if (isActive) mutation.mutate({ item, isActive });
    else setPending(item);
  };

  const confirmation = (
    <Dialog
      open={pending !== null}
      onClose={() => setPending(null)}
      title={pending ? `Desativar ${nameOf(pending)}?` : 'Desativar?'}
      description="Itens desativados deixam de aparecer para quem agenda. Você pode ativá-los de novo quando quiser."
    >
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={() => setPending(null)}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          loading={mutation.isPending}
          onClick={() => pending && mutation.mutate({ item: pending, isActive: false })}
        >
          Desativar
        </Button>
      </div>
    </Dialog>
  );

  const isBusy = (item: T) =>
    mutation.isPending && mutation.variables !== undefined && keyOf(mutation.variables.item) === keyOf(item);

  return { request, isBusy, confirmation };
}
