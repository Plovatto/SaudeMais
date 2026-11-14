import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LuSend, LuShieldCheck, LuShieldOff, LuStethoscope, LuUserCheck, LuUserX } from 'react-icons/lu';
import { PersonalDataCard } from '@components/forms/PersonalDataCard';
import { Button, ButtonLink, FormAlert, SectionCard, useToast } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { personalDataBody } from '@lib/validation/account-fields';
import { ADMIN_USERS_PATH, syncUser, type UserLocks } from './user-cache';
import { userMessages } from './user-messages';
import { UserBadges } from './UserBadges';
import { UserDetailGate } from './UserDetailGate';
import { usersApi, type AdminUserDetail } from './users-api';
import { useUserActions } from './useUserActions';

interface SectionProps {
  user: AdminUserDetail;
  locks: UserLocks;
}

function PasswordResetSection({ user, locks }: SectionProps) {
  const { show } = useToast();
  const send = useMutation({
    mutationFn: () => usersApi.sendPasswordReset(user.id),
    onSuccess: () => show({ message: `Link de redefinição enviado para ${user.email}.`, tone: 'success' }),
  });
  return (
    <SectionCard
      title="Senha"
      description="A senha não é definida por aqui. Envie um link para a pessoa criar uma nova senha pelo e-mail; ele vale por 30 minutos."
    >
      {send.isError && <FormAlert>{errorMessage(send.error, userMessages)}</FormAlert>}
      <Button
        variant="secondary"
        icon={<LuSend />}
        loading={send.isPending}
        disabled={locks.isProtected || locks.isInactive}
        onClick={() => send.mutate()}
        className="self-start"
      >
        Enviar link de redefinição
      </Button>
    </SectionCard>
  );
}

function RolesSection({
  user,
  locks,
  actions,
}: SectionProps & { actions: ReturnType<typeof useUserActions> }) {
  const isAdmin = user.roles.includes('admin');
  const profile = user.doctorProfile;
  const frozen = locks.isProtected || locks.isInactive;
  const busy = actions.busyId === user.id;
  return (
    <SectionCard title="Perfis" description="O que esta conta pode fazer no Saúde+.">
      <UserBadges roles={user.roles} locks={locks} specialty={profile?.specialtyName} />
      {profile && (
        <dl className="text-text grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-text-secondary">Especialidade</dt>
          <dd>{profile.specialtyName}</dd>
          <dt className="text-text-secondary">Registro</dt>
          <dd>
            {profile.council} {profile.registryNumber}/{profile.registryUf}
          </dd>
          <dt className="text-text-secondary">Unidade</dt>
          <dd>{profile.unitName}</dd>
        </dl>
      )}
      <div className="flex flex-wrap gap-3">
        {frozen ? (
          <Button variant="secondary" icon={<LuStethoscope />} disabled>
            {profile ? 'Editar perfil de médico' : 'Tornar médico'}
          </Button>
        ) : (
          <ButtonLink to={`${ADMIN_USERS_PATH}/${user.id}/medico`} variant="secondary">
            <LuStethoscope aria-hidden />
            {profile ? 'Editar perfil de médico' : 'Tornar médico'}
          </ButtonLink>
        )}
        <Button
          variant="secondary"
          icon={isAdmin ? <LuShieldOff /> : <LuShieldCheck />}
          disabled={frozen || (isAdmin && locks.isSelf)}
          loading={busy}
          onClick={() => actions.request(isAdmin ? 'revokeAdmin' : 'grantAdmin', user)}
        >
          {isAdmin ? 'Remover admin' : 'Tornar admin'}
        </Button>
      </div>
      {isAdmin && locks.isSelf && (
        <p className="text-text-secondary text-sm">
          Você não pode remover o perfil de administrador da própria conta.
        </p>
      )}
    </SectionCard>
  );
}

function AccountSection({
  user,
  locks,
  actions,
}: SectionProps & { actions: ReturnType<typeof useUserActions> }) {
  const busy = actions.busyId === user.id;
  return (
    <SectionCard
      title="Situação da conta"
      description={
        locks.isInactive
          ? 'A conta está desativada e não consegue entrar no Saúde+.'
          : 'Ao desativar, a conta deixa de entrar e os agendamentos futuros dela são cancelados.'
      }
    >
      {locks.isInactive ? (
        <Button
          variant="secondary"
          icon={<LuUserCheck />}
          disabled={locks.isProtected}
          loading={busy}
          onClick={() => actions.request('reactivate', user)}
          className="self-start"
        >
          Reativar conta
        </Button>
      ) : (
        <Button
          variant="danger"
          icon={<LuUserX />}
          disabled={locks.isProtected || locks.isSelf}
          loading={busy}
          onClick={() => actions.request('deactivate', user)}
          className="self-start"
        >
          Desativar conta
        </Button>
      )}
      {locks.isSelf && (
        <p className="text-text-secondary text-sm">Você não pode desativar a própria conta.</p>
      )}
    </SectionCard>
  );
}

export function EditUserPage() {
  const queryClient = useQueryClient();
  const actions = useUserActions();
  return (
    <UserDetailGate title="Editar usuário" backFallback={() => ADMIN_USERS_PATH}>
      {(user, locks) => (
        <>
          <PersonalDataCard
            key={user.id}
            title="Dados pessoais"
            person={user}
            locked={locks.isProtected || locks.isInactive}
            messages={userMessages}
            onSave={async (values) => {
              const updated = await usersApi.update(user.id, personalDataBody(values));
              syncUser(queryClient, updated);
              return updated;
            }}
          />
          <PasswordResetSection user={user} locks={locks} />
          <RolesSection user={user} locks={locks} actions={actions} />
          <AccountSection user={user} locks={locks} actions={actions} />
          {actions.dialogs}
        </>
      )}
    </UserDetailGate>
  );
}
