import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LuCake, LuLock } from 'react-icons/lu';
import { FormShell } from '@components/forms/FormShell';
import { IdentityHeader } from '@components/forms/IdentityHeader';
import { PersonalDataFields } from '@components/forms/PersonalDataFields';
import { Drawer, Input, useToast } from '@components/ui';
import { areas, type Role } from '@constants/areas';
import { useReportSubmitting } from '@hooks/useReportSubmitting';
import type { CurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@hooks/useFormSubmit';
import { updateProfile } from './profile-api';
import {
  birthDateLimits,
  profileBody,
  profileSchema,
  profileValues,
  type ProfileValues,
} from './profile-schemas';

const INCOMPLETE_BIRTH_DATE = 'Complete a data de nascimento ou deixe o campo em branco.';

function hasIncompleteBirthDate(form: HTMLFormElement): boolean {
  const field = form.elements.namedItem('birthDate');
  return field instanceof HTMLInputElement && field.validity.badInput;
}

interface EditProfileFormProps {
  user: CurrentUser;
  role: Role;
  withBirthDate: boolean;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}

function EditProfileForm({ user, role, withBirthDate, onClose, onSubmittingChange }: EditProfileFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: profileValues(user) });
  const { alert, run } = useFormSubmit(setError, ['fullName', 'phone', 'birthDate']);
  useReportSubmitting(isSubmitting, onSubmittingChange);

  const submit = handleSubmit((values) =>
    run(async () => {
      const updated = await updateProfile(profileBody(values, withBirthDate));
      queryClient.setQueryData(queryKeys.session, updated);
      onClose();
      show({ message: 'Dados atualizados.', tone: 'success' });
    }),
  );

  return (
    <FormShell
      onSubmit={async (event) => {
        if (hasIncompleteBirthDate(event.currentTarget)) {
          event.preventDefault();
          setError('birthDate', { message: INCOMPLETE_BIRTH_DATE }, { shouldFocus: true });
          return;
        }
        await submit(event);
      }}
      alert={alert}
      submitting={isSubmitting}
      onCancel={onClose}
      submitLabel="Salvar alterações"
      submitDisabled={!isDirty}
    >
      <IdentityHeader name={user.fullName} seed={user.id} detail={areas[role].label} />
      <PersonalDataFields
        fullName={register('fullName')}
        phone={register('phone')}
        errors={{ fullName: errors.fullName?.message, phone: errors.phone?.message }}
        ownAccount
      />
      {withBirthDate && (
        <Input
          label="Data de nascimento"
          type="date"
          autoComplete="bday"
          icon={<LuCake />}
          hint="Opcional. Deixe em branco para remover."
          {...birthDateLimits()}
          error={errors.birthDate?.message}
          {...register('birthDate')}
        />
      )}
      <Input
        label="E-mail"
        type="email"
        value={user.email}
        readOnly
        end={<LuLock aria-hidden className="text-text-muted me-3.5 shrink-0" />}
        hint="Usado para entrar. Para trocar, fale com a administração."
      />
    </FormShell>
  );
}

export interface EditProfileDrawerProps extends Omit<EditProfileFormProps, 'onSubmittingChange'> {
  open: boolean;
}

export function EditProfileDrawer({ open, ...props }: EditProfileDrawerProps) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Drawer open={open} onClose={props.onClose} title="Editar perfil" dismissible={!submitting}>
      {open && <EditProfileForm {...props} onSubmittingChange={setSubmitting} />}
    </Drawer>
  );
}
