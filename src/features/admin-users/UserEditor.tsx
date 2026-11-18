import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, type ReactNode, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { LuMail, LuSend, LuShieldCheck, LuShieldOff, LuStethoscope } from 'react-icons/lu';
import { FormShell } from '@components/forms/FormShell';
import { IdentityHeader } from '@components/forms/IdentityHeader';
import { PersonalDataFields, ReadOnlyEmailField } from '@components/forms/PersonalDataFields';
import { Button, FormAlert, SettingRow, Switch, useToast } from '@components/ui';
import { formatCivilDate } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { useFormSubmit } from '@hooks/useFormSubmit';
import {
  personalDataBody,
  personalDataSchema,
  personalDataValues,
  type PersonalDataValues,
} from '@lib/validation/account-fields';
import { syncUser, type UserLocks } from './user-cache';
import { userMessages } from './user-messages';
import { UserBadges } from './UserBadges';
import { usersApi, type AdminUserDetail } from './users-api';
import { useReportSubmitting } from '@hooks/useReportSubmitting';
import type { useUserActions } from './useUserActions';

type UserActions = ReturnType<typeof useUserActions>;

interface SectionProps {
  user: AdminUserDetail;
  locks: UserLocks;
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="border-border flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-0.5">
        <h3 id={id} className="text-text text-sm font-semibold">
          {title}
        </h3>
        {description && <p className="text-text-secondary text-[0.8125rem]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function RolesSection({
  user,
  locks,
  actions,
  doctorButton,
  focusDoctor,
  onDoctor,
}: SectionProps & {
  actions: UserActions;
  doctorButton: RefObject<HTMLButtonElement | null>;
  focusDoctor: boolean;
  onDoctor: () => void;
}) {
  const isAdmin = user.roles.includes('admin');
  const profile = user.doctorProfile;
  const frozen = locks.isInactive;
  const ownAdmin = isAdmin && locks.isSelf;
  const ownAdminHint = useId();
  return (
    <PanelSection title="Perfis" description="O que esta conta pode fazer no Saúde+.">
      {profile && (
        <dl className="text-text grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
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
        <Button
          ref={doctorButton}
          variant="secondary"
          icon={<LuStethoscope />}
          disabled={frozen}
          autoFocus={focusDoctor}
          onClick={onDoctor}
        >
          {profile ? 'Editar perfil de médico' : 'Tornar médico'}
        </Button>
        <Button
          variant="secondary"
          icon={isAdmin ? <LuShieldOff /> : <LuShieldCheck />}
          disabled={frozen || ownAdmin}
          aria-describedby={ownAdmin ? ownAdminHint : undefined}
          loading={actions.isBusy(user, 'grantAdmin', 'revokeAdmin')}
          onClick={() => actions.request(isAdmin ? 'revokeAdmin' : 'grantAdmin', user)}
        >
          {isAdmin ? 'Remover admin' : 'Tornar admin'}
        </Button>
      </div>
      {ownAdmin && (
        <p id={ownAdminHint} className="text-text-secondary text-sm">
          Você não pode remover o perfil de administrador da própria conta.
        </p>
      )}
    </PanelSection>
  );
}

function PasswordResetSection({ user, locks }: SectionProps) {
  const { show } = useToast();
  const send = useMutation({
    mutationFn: () => usersApi.sendPasswordReset(user.id),
    onSuccess: () => show({ message: `Link de redefinição enviado para ${user.email}.`, tone: 'success' }),
  });
  return (
    <PanelSection
      title="Senha"
      description="A senha não é definida por aqui. Envie um link para a pessoa criar uma nova senha pelo e-mail; ele vale por 30 minutos."
    >
      {send.isError && <FormAlert>{errorMessage(send.error, userMessages)}</FormAlert>}
      <Button
        variant="secondary"
        icon={<LuSend />}
        loading={send.isPending}
        disabled={locks.isInactive}
        onClick={() => send.mutate()}
        className="self-start"
      >
        Enviar link de redefinição
      </Button>
    </PanelSection>
  );
}

function AccessSection({ user, locks, actions }: SectionProps & { actions: UserActions }) {
  const selfHint = useId();
  return (
    <PanelSection title="Acesso">
      <SettingRow
        className="gap-4"
        title="Acesso ativo"
        meta={
          locks.isInactive
            ? 'Usuários inativos não conseguem entrar.'
            : 'Ao desativar, a conta deixa de entrar e os agendamentos futuros dela são cancelados.'
        }
        trailing={
          <Switch
            label="Acesso ativo"
            labelHidden
            checked={!locks.isInactive}
            disabled={locks.isSelf && !locks.isInactive}
            ariaDescribedBy={locks.isSelf ? selfHint : undefined}
            busy={actions.isBusy(user, 'deactivate', 'reactivate')}
            onCheckedChange={(active) => actions.request(active ? 'reactivate' : 'deactivate', user)}
          />
        }
      />
      {locks.isSelf && (
        <p id={selfHint} className="text-text-secondary text-sm">
          Você não pode desativar a própria conta.
        </p>
      )}
    </PanelSection>
  );
}

export interface UserEditorProps extends SectionProps {
  actions: UserActions;
  doctorButton: RefObject<HTMLButtonElement | null>;
  focusDoctor: boolean;
  onDoctor: () => void;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}

export function UserEditor({
  user,
  locks,
  actions,
  doctorButton,
  focusDoctor,
  onDoctor,
  onClose,
  onSubmittingChange,
}: UserEditorProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PersonalDataValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: personalDataValues(user),
  });
  const { alert, run } = useFormSubmit(setError, ['fullName', 'phone'], undefined, userMessages);
  useReportSubmitting(isSubmitting, onSubmittingChange);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      syncUser(queryClient, await usersApi.update(user.id, personalDataBody(values)));
      show({ message: 'Usuário atualizado.', tone: 'success' });
      onClose();
    }),
  );

  return (
    <FormShell
      onSubmit={onSubmit}
      alert={null}
      submitting={isSubmitting}
      onCancel={onClose}
      submitLabel="Salvar alterações"
      submitDisabled={locks.isInactive || !isDirty}
    >
      <IdentityHeader
        name={user.fullName}
        seed={user.id}
        detail={`Cadastro em ${formatCivilDate(user.createdAt)}`}
      />
      <UserBadges roles={user.roles} locks={locks} specialty={user.doctorProfile?.specialtyName} />
      {locks.isInactive && (
        <FormAlert tone="warning" role="note">
          Esta conta está desativada. Reative-a para alterar dados e perfis.
        </FormAlert>
      )}
      <ReadOnlyEmailField
        email={user.email}
        icon={<LuMail />}
        hint="O e-mail é usado para entrar e não pode ser alterado."
      />
      <PersonalDataFields
        fullName={register('fullName')}
        phone={register('phone')}
        errors={{ fullName: errors.fullName?.message, phone: errors.phone?.message }}
        locked={locks.isInactive}
        ownAccount={false}
      />
      {alert && <FormAlert>{alert}</FormAlert>}
      <RolesSection
        user={user}
        locks={locks}
        actions={actions}
        doctorButton={doctorButton}
        focusDoctor={focusDoctor}
        onDoctor={onDoctor}
      />
      <PasswordResetSection user={user} locks={locks} />
      <AccessSection user={user} locks={locks} actions={actions} />
    </FormShell>
  );
}
