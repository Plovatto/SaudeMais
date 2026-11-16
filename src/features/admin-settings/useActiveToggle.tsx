import type { QueryKey } from '@tanstack/react-query';
import { catalogMessages } from './catalog-messages';
import { useConfirmedAction } from './useConfirmedAction';

export interface ActiveToggleOptions<T> {
  nameOf: (item: T) => string;
  keyOf: (item: T) => string;
  setActive: (item: T, isActive: boolean) => Promise<unknown>;
  invalidate: QueryKey;
}

interface Change<T> {
  item: T;
  isActive: boolean;
}

export function useActiveToggle<T>({ nameOf, keyOf, setActive, invalidate }: ActiveToggleOptions<T>) {
  const action = useConfirmedAction<Change<T>>({
    keyOf: ({ item }) => keyOf(item),
    run: ({ item, isActive }) => setActive(item, isActive),
    invalidate,
    success: ({ item, isActive }) => `${nameOf(item)} ${isActive ? 'ativado' : 'desativado'}.`,
    confirm: (change) => ({
      title: change ? `Desativar ${nameOf(change.item)}?` : 'Desativar?',
      description:
        'Itens desativados deixam de aparecer para quem agenda. Você pode ativá-los de novo quando quiser.',
      confirmLabel: 'Desativar',
    }),
    messages: catalogMessages,
  });

  const request = (item: T, isActive: boolean) =>
    isActive ? action.run({ item, isActive }) : action.ask({ item, isActive });

  return {
    request,
    isBusy: (item: T) => action.isBusy({ item, isActive: false }),
    confirmation: action.confirmation,
  };
}
