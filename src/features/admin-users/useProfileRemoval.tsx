import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { useToast } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
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
  const { show } = useToast();
  const [pending, setPending] = useState<AdminUser | null>(null);

  const mutation = useMutation({
    mutationFn: (user: AdminUser) => usersApi.removeDoctorProfile(user.id),
    onSuccess: (updated) => {
      syncUser(queryClient, updated);
      show({ message: 'Perfil de médico removido.', tone: 'success' });
      onRemoved();
    },
    onError: (error, user) => {
      refreshUser(queryClient, user.id);
      show({ message: errorMessage(error, userMessages), tone: 'danger' });
    },
    onSettled: () => setPending(null),
  });

  const dialog = (
    <ImpactDialog
      userId={pending?.id ?? null}
      title={`Remover o perfil de médico de ${pending?.fullName ?? ''}?`}
      confirmLabel="Remover perfil"
      describe={describeRemoval}
      loading={mutation.isPending}
      onConfirm={() => pending && mutation.mutate(pending)}
      onClose={() => setPending(null)}
      fallbackFocus={fallbackFocus}
    />
  );

  return { request: (user: AdminUser) => setPending(user), dialog };
}
