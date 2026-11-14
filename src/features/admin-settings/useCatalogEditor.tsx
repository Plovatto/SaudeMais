import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { Dialog } from '@components/ui';

type Editing<T> = { item: T | null } | null;

export function useCatalogEditor<T>(fallbackFocus: RefObject<HTMLElement | null>) {
  const [editing, setEditing] = useState<Editing<T>>(null);
  const close = useCallback(() => setEditing(null), []);
  const panel = (
    titleOf: (item: T | null) => string,
    formOf: (item: T | null, close: () => void) => ReactNode,
  ) => (
    <Dialog
      open={editing !== null}
      onClose={close}
      placement="side"
      title={editing ? titleOf(editing.item) : ''}
      fallbackFocus={fallbackFocus}
    >
      {editing && formOf(editing.item, close)}
    </Dialog>
  );
  return { create: () => setEditing({ item: null }), edit: (item: T) => setEditing({ item }), panel };
}
