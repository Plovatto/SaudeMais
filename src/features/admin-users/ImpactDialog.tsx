import { useQuery } from '@tanstack/react-query';
import { ConfirmDialog, type ConfirmDialogProps } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { usersApi, type DeactivationImpact } from './users-api';

export interface ImpactDialogProps extends Pick<
  ConfirmDialogProps,
  'title' | 'confirmLabel' | 'onConfirm' | 'onClose' | 'fallbackFocus'
> {
  userId: string | null;
  describe: (impact: DeactivationImpact) => string;
  loading: boolean;
}

export function ImpactDialog({ userId, describe, ...dialog }: ImpactDialogProps) {
  const impact = useQuery({
    queryKey: queryKeys.adminUsers.impact(userId ?? ''),
    queryFn: ({ signal }) => usersApi.impact(userId ?? '', signal),
    enabled: userId !== null,
  });
  const description = impact.data
    ? describe(impact.data)
    : impact.isError
      ? 'Não foi possível conferir os agendamentos futuros. Os que existirem serão cancelados.'
      : 'Conferindo os agendamentos futuros…';
  return (
    <ConfirmDialog {...dialog} open={userId !== null} description={description} disabled={impact.isPending} />
  );
}
