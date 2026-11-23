import { useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { usePendingMutation } from '@hooks/usePendingMutation';
import { plural } from '@lib/plural';
import { ImpactDialog } from './ImpactDialog';
import { refreshUser, syncUser } from './user-cache';
import { userMessages } from './user-messages';
import { usersApi, type AdminUser, type DeactivationImpact } from './users-api';

const describeRemoval = ({ futureAppointmentsAsDoctor }: DeactivationImpact) =>
  futureAppointmentsAsDoctor > 0
    ? `${plural(futureAppointmentsAsDoctor, 'consulta futura será cancelada', 'consultas futuras serão canceladas')}. A conta continua como paciente.`
    : 'Não há consultas futuras para cancelar. A conta continua como paciente.';

export function useProfileRemoval(fallbackFocus: RefObject<HTMLElement | null>, onRemoved: () => void) {
  const queryClient = useQueryClient();
  const { mutation, pending, ask, close } = usePendingMutation({
    run: (user: AdminUser) => usersApi.removeDoctorProfile(user.id),
    success: () => 'Perfil de médico removido.',
    messages: userMessages,
    onSuccess: (updated) => {
      syncUser(queryClient, updated);
      onRemoved();
    },
    onError: (_error, user) => refreshUser(queryClient, user.id),
  });

  const dialog = (
    <ImpactDialog
      userId={pending?.id ?? null}
      title={`Remover o perfil de médico de ${pending?.fullName ?? ''}?`}
      confirmLabel="Remover perfil"
      describe={describeRemoval}
      loading={mutation.isPending}
      onConfirm={() => pending && mutation.mutate(pending)}
      onClose={close}
      fallbackFocus={fallbackFocus}
    />
  );

  return { request: ask, dismiss: close, dialog };
}
