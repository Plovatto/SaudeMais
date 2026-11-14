import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LuPencil, LuShieldCheck, LuShieldOff, LuStethoscope, LuUserCheck, LuUserX } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { ConfirmDialog, useToast, type MenuItem } from '@components/ui';
import { useCurrentUser } from '@lib/auth/useSession';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { ImpactDialog } from './ImpactDialog';
import { countOf } from './user-text';
import { ADMIN_USERS_PATH, syncUser, userLocks } from './user-cache';
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
      `${countOf(futureAppointmentsAsPatient, 'agendamento futuro', 'agendamentos futuros')} como paciente`,
    futureAppointmentsAsDoctor > 0 &&
      `${countOf(futureAppointmentsAsDoctor, 'consulta futura', 'consultas futuras')} como médico`,
  ].filter(Boolean);
  const bookings = parts.length
    ? `Serão cancelados: ${parts.join(' e ')}.`
    : 'Não há agendamentos futuros para cancelar.';
  return `A conta não poderá mais entrar no Saúde+. ${bookings} Você pode reativá-la depois.`;
};

export function useUserActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { show } = useToast();
  const currentUser = useCurrentUser();
  const [pending, setPending] = useState<Pending | null>(null);

  const mutation = useMutation({
    mutationFn: ({ action, user }: Pending) => run[action](user.id),
    onSuccess: (updated, { action, user }) => {
      syncUser(queryClient, updated);
      show({ message: done[action](user.fullName), tone: 'success' });
    },
    onError: (error) => show({ message: errorMessage(error, userMessages), tone: 'danger' }),
    onSettled: () => setPending(null),
  });

  const request = (action: UserAction, user: AdminUser) => {
    if (action === 'reactivate') mutation.mutate({ action, user });
    else setPending({ action, user });
  };

  const itemsFor = (user: AdminUser): MenuItem[] => {
    const { isProtected, isInactive, isSelf } = userLocks(user, currentUser.id);
    const isAdmin = user.roles.includes('admin');
    const frozen = isProtected || isInactive;
    return [
      {
        label: 'Editar',
        icon: <LuPencil />,
        onSelect: () => void navigate(`${ADMIN_USERS_PATH}/${user.id}`),
      },
      {
        label: user.roles.includes('doctor') ? 'Perfil de médico' : 'Tornar médico',
        icon: <LuStethoscope />,
        disabled: frozen,
        onSelect: () => void navigate(`${ADMIN_USERS_PATH}/${user.id}/medico`),
      },
      {
        label: isAdmin ? 'Remover admin' : 'Tornar admin',
        icon: isAdmin ? <LuShieldOff /> : <LuShieldCheck />,
        disabled: frozen || (isAdmin && isSelf),
        onSelect: () => request(isAdmin ? 'revokeAdmin' : 'grantAdmin', user),
      },
      isInactive
        ? {
            label: 'Reativar',
            icon: <LuUserCheck />,
            disabled: isProtected,
            onSelect: () => request('reactivate', user),
          }
        : {
            label: 'Desativar',
            icon: <LuUserX />,
            tone: 'danger',
            disabled: isProtected || isSelf,
            onSelect: () => request('deactivate', user),
          },
    ];
  };

  const close = () => setPending(null);
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
      />
    </>
  );

  return { itemsFor, request, dialogs, busyId: mutation.isPending ? mutation.variables.user.id : null };
}
