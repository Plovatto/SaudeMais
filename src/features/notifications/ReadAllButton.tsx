import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LuCheckCheck } from 'react-icons/lu';
import { Button, useToast } from '@components/ui';
import type { Role } from '@constants/areas';
import {
  invalidateNotifications,
  markAllNotificationsRead,
  unreadCountQuery,
} from '@lib/api/notifications-api';
import { isProtectedAccount } from '@lib/auth/protected-account';
import { errorMessage } from '@lib/messages/errors.pt-BR';

const DEMO_MESSAGE =
  'Esta é uma conta de demonstração: as notificações podem ser vistas, mas não marcadas como lidas.';

export function ReadAllButton({ role }: { role: Role }) {
  const unread = useQuery(unreadCountQuery(role)).data ?? 0;
  const queryClient = useQueryClient();
  const { show } = useToast();
  const mutation = useMutation({
    mutationFn: () => markAllNotificationsRead(role),
    onSuccess: () => invalidateNotifications(queryClient),
    onError: (error) =>
      show(
        isProtectedAccount(error)
          ? { message: DEMO_MESSAGE, tone: 'info' }
          : { message: errorMessage(error), tone: 'danger' },
      ),
  });
  return (
    <Button
      variant="ghost"
      icon={<LuCheckCheck />}
      disabled={unread === 0}
      loading={mutation.isPending}
      onClick={() => mutation.mutate()}
      className="min-h-9 shrink-0 px-2 text-sm font-medium"
    >
      Marcar todas como lidas
    </Button>
  );
}
