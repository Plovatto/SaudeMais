import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, type RefObject } from 'react';
import { LuCheck } from 'react-icons/lu';
import { Button, useToast } from '@components/ui';
import type { Role } from '@constants/areas';
import {
  invalidateNotifications,
  markAllNotificationsRead,
  unreadCountQuery,
} from '@lib/api/notifications-api';
import { cx } from '@lib/cx';
import { errorMessage } from '@lib/messages/errors.pt-BR';

const LABEL = 'Marcar todas como lidas';

export interface ReadAllButtonProps {
  role: Role;
  unread: number | undefined;
  focusAfter: RefObject<HTMLElement | null>;
  compact?: boolean;
}

export function ReadAllButton({ role, unread, focusAfter, compact = false }: ReadAllButtonProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  const mutation = useMutation({
    mutationFn: () => markAllNotificationsRead(role),
    onSuccess: async () => {
      await invalidateNotifications(queryClient);
      if ((queryClient.getQueryData(unreadCountQuery(role).queryKey)?.count ?? 0) > 0)
        refocus.current = false;
    },
    onError: (error) => {
      refocus.current = false;
      show({ message: errorMessage(error), tone: 'danger' });
    },
  });

  useEffect(() => {
    if (unread !== 0 || !refocus.current) return;
    refocus.current = false;
    focusAfter.current?.focus();
  }, [unread, focusAfter]);

  if (!unread) return null;
  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="sm"
      icon={<LuCheck />}
      loading={mutation.isPending}
      title={compact ? LABEL : undefined}
      onClick={() => {
        refocus.current = document.activeElement === buttonRef.current;
        mutation.mutate();
      }}
      className={cx('shrink-0', compact ? 'ms-auto -me-2 min-h-7 px-2 lg:min-h-7' : '-me-2 px-2')}
    >
      <span className={cx(compact && 'sr-only')}>{LABEL}</span>
    </Button>
  );
}
