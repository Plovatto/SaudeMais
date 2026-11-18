import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { LuMail, LuUserCog } from 'react-icons/lu';
import { FormShell } from '@components/forms/FormShell';
import { PersonalDataFields } from '@components/forms/PersonalDataFields';
import { Dropdown, Input, useToast } from '@components/ui';
import type { Role } from '@constants/areas';
import { useFormSubmit } from '@lib/useFormSubmit';
import { DoctorProfileFields } from './DoctorProfileFields';
import { useDoctorCatalog } from './useDoctorCatalog';
import { useReportSubmitting } from './useReportSubmitting';
import { syncUser } from './user-cache';
import { userMessages } from './user-messages';
import {
  createUserBody,
  createUserSchema,
  DOCTOR_FIELDS,
  emptyCreateUser,
  USER_ROLES,
  type CreateUserValues,
} from './user-schemas';
import { usersApi } from './users-api';

const ROLE_OPTIONS: Record<Role, { label: string; hint: string }> = {
  patient: { label: 'Paciente', hint: 'Agenda consultas e exames' },
  doctor: { label: 'Médico', hint: 'Atende e cuida da própria agenda' },
  admin: { label: 'Administrador', hint: 'Cuida de usuários e configurações' },
};

const FIELDS = [
  'fullName',
  'email',
  'phone',
  'role',
  ...DOCTOR_FIELDS.map((field) => `doctorProfile.${field}` as const),
] as const;

const ALIASES = Object.fromEntries(DOCTOR_FIELDS.map((field) => [field, `doctorProfile.${field}` as const]));

export interface CreateUserFormProps {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}

export function CreateUserForm({ onClose, onSubmittingChange }: CreateUserFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: emptyCreateUser,
  });
  const { alert, run } = useFormSubmit(setError, FIELDS, undefined, userMessages, ALIASES);
  const role = useWatch({ control, name: 'role' });
  const catalog = useDoctorCatalog(null, useWatch({ control, name: 'doctorProfile.specialtyId' }));
  const doctorErrors = errors.doctorProfile;
  useReportSubmitting(isSubmitting, onSubmittingChange);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      syncUser(queryClient, await usersApi.create(createUserBody(values)));
      show({ message: 'Usuário criado. Ele recebe um e-mail para criar a senha.', tone: 'success' });
      onClose();
    }),
  );

  return (
    <FormShell
      label="Novo usuário"
      onSubmit={onSubmit}
      alert={alert}
      submitting={isSubmitting}
      onCancel={onClose}
      submitLabel="Criar usuário"
      submitDisabled={role === 'doctor' && (catalog.loading || catalog.error !== null)}
    >
      <Input
        label="E-mail"
        type="email"
        autoComplete="off"
        placeholder="nome@email.com"
        hint="A pessoa recebe neste e-mail o link para criar a senha."
        icon={<LuMail />}
        error={errors.email?.message}
        {...register('email')}
      />
      <PersonalDataFields
        fullName={register('fullName')}
        phone={register('phone')}
        errors={{ fullName: errors.fullName?.message, phone: errors.phone?.message }}
        ownAccount={false}
        phoneHint="Opcional, com DDD."
      />
      <Controller
        control={control}
        name="role"
        render={({ field, fieldState }) => (
          <Dropdown
            ref={field.ref}
            label="Perfil"
            placeholder="Escolha o perfil"
            icon={<LuUserCog />}
            options={USER_ROLES.map((value) => ({ value, ...ROLE_OPTIONS[value] }))}
            value={field.value}
            error={fieldState.error?.message}
            onChange={field.onChange}
          />
        )}
      />
      {role === 'doctor' && (
        <DoctorProfileFields
          catalog={catalog}
          fields={{
            specialtyId: register('doctorProfile.specialtyId'),
            registryNumber: register('doctorProfile.registryNumber'),
            registryUf: register('doctorProfile.registryUf'),
            unitId: register('doctorProfile.unitId'),
          }}
          errors={{
            specialtyId: doctorErrors?.specialtyId?.message,
            registryNumber: doctorErrors?.registryNumber?.message,
            registryUf: doctorErrors?.registryUf?.message,
            unitId: doctorErrors?.unitId?.message,
          }}
        />
      )}
    </FormShell>
  );
}
