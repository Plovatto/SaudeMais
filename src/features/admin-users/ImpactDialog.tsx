import { useQuery } from '@tanstack/react-query';
import { ConfirmDialog } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { usersApi, type DeactivationImpact } from './users-api';

export interface ImpactDialogProps {
  userId: string | null;
  title: string;
  confirmLabel: string;
  describe: (impact: DeactivationImpact) => string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ImpactDialog({
  userId,
  title,
  confirmLabel,
  describe,
  loading,
  onConfirm,
  onClose,
}: ImpactDialogProps) {
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
    <ConfirmDialog
      open={userId !== null}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
