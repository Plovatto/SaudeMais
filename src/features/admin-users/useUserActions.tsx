import { useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { ConfirmDialog } from '@components/ui';
import { usePendingMutation } from '@hooks/usePendingMutation';
import { ImpactDialog } from './ImpactDialog';
import { plural } from '@lib/plural';
import { refreshUser, syncUser } from './user-cache';
import { userMessages } from './user-messages';
import { usersApi, type AdminUser, type DeactivationImpact } from './users-api';

export type UserAction = 'deactivate' | 'reactivate' | 'grantAdmin' | 'revokeAdmin';

interface Pending {
  action: UserAction;
  user: AdminUser;
}

const run: Record<UserAction, typeof usersApi.deactivate> = {
  deactivate: usersApi.deactivate,
  reactivate: usersApi.reactivate,
  grantAdmin: usersApi.grantAdmin,
  revokeAdmin: usersApi.revokeAdmin,
};

const done: Record<UserAction, (name: string) => string> = {
  deactivate: (name) => `Conta de ${name} desativada.`,
  reactivate: (name) => `Conta de ${name} reativada.`,
  grantAdmin: (name) => `${name} agora tem perfil de administrador.`,
  revokeAdmin: (name) => `${name} não tem mais perfil de administrador.`,
};

const describeDeactivation = ({
  futureAppointmentsAsPatient,
  futureAppointmentsAsDoctor,
}: DeactivationImpact) => {
  const parts = [
    futureAppointmentsAsPatient > 0 &&
      `${plural(futureAppointmentsAsPatient, 'agendamento futuro', 'agendamentos futuros')} como paciente`,
    futureAppointmentsAsDoctor > 0 &&
      `${plural(futureAppointmentsAsDoctor, 'consulta futura', 'consultas futuras')} como médico`,
  ].filter(Boolean);
  const bookings = parts.length
    ? `Serão cancelados: ${parts.join(' e ')}.`
    : 'Não há agendamentos futuros para cancelar.';
  return `A conta não poderá mais entrar no Saúde+. ${bookings} Você pode reativá-la depois.`;
};

export function useUserActions(fallbackFocus?: RefObject<HTMLElement | null>) {
  const queryClient = useQueryClient();
  const { mutation, pending, ask, close } = usePendingMutation({
    run: ({ action, user }: Pending) => run[action](user.id),
    success: ({ action, user }) => done[action](user.fullName),
    messages: userMessages,
    onSuccess: (updated) => syncUser(queryClient, updated),
    onError: (_error, { user }) => refreshUser(queryClient, user.id),
  });

  const request = (action: UserAction, user: AdminUser) => {
    if (action === 'reactivate') mutation.mutate({ action, user });
    else ask({ action, user });
  };

  const isBusy = (user: AdminUser, ...actions: UserAction[]) =>
    mutation.isPending &&
    mutation.variables.user.id === user.id &&
    actions.includes(mutation.variables.action);

  const confirm = () => pending && mutation.mutate(pending);
  const revoking = pending?.action === 'revokeAdmin';
  const adminChange = revoking || pending?.action === 'grantAdmin' ? pending : null;
  const name = pending?.user.fullName ?? '';

  const dialogs = (
    <>
      <ImpactDialog
        userId={pending?.action === 'deactivate' ? pending.user.id : null}
        title={`Desativar a conta de ${name}?`}
        confirmLabel="Desativar"
        describe={describeDeactivation}
        loading={mutation.isPending}
        onConfirm={confirm}
        onClose={close}
        fallbackFocus={fallbackFocus}
      />
      <ConfirmDialog
        open={adminChange !== null}
        tone={revoking ? 'danger' : 'primary'}
        title={
          revoking
            ? `Remover o perfil de administrador de ${name}?`
            : `Dar perfil de administrador a ${name}?`
        }
        description={
          revoking
            ? 'A conta deixa de acessar a área de administração.'
            : 'A conta passa a gerenciar usuários e configurações do sistema.'
        }
        confirmLabel={revoking ? 'Remover admin' : 'Tornar admin'}
        loading={mutation.isPending}
        onConfirm={confirm}
        onClose={close}
        fallbackFocus={fallbackFocus}
      />
    </>
  );

  return { request, dialogs, isBusy };
}
