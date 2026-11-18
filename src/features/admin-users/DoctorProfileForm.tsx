import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { LuTrash2, LuUser } from 'react-icons/lu';
import { FormShell } from '@components/forms/FormShell';
import { Button, Input, useToast } from '@components/ui';
import { useFormSubmit } from '@lib/useFormSubmit';
import { DoctorProfileFields } from './DoctorProfileFields';
import { useDoctorCatalog } from './useDoctorCatalog';
import { useReportSubmitting } from '@hooks/useReportSubmitting';
import { syncUser } from './user-cache';
import { userMessages } from './user-messages';
import { DOCTOR_FIELDS, doctorProfileSchema, type DoctorProfileValues } from './user-schemas';
import { usersApi, type AdminUserDetail } from './users-api';

export interface DoctorProfileFormProps {
  user: AdminUserDetail;
  locked: boolean;
  onBack: () => void;
  onRemove: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}

export function DoctorProfileForm({
  user,
  locked,
  onBack,
  onRemove,
  onSubmittingChange,
}: DoctorProfileFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const profile = user.doctorProfile;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<DoctorProfileValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      specialtyId: profile?.specialtyId ?? '',
      registryNumber: profile?.registryNumber ?? '',
      registryUf: profile?.registryUf ?? '',
      unitId: profile?.unitId ?? '',
    },
  });
  const { alert, run } = useFormSubmit(setError, DOCTOR_FIELDS, undefined, userMessages);
  useReportSubmitting(isSubmitting, onSubmittingChange);
  const catalog = useDoctorCatalog(profile, useWatch({ control, name: 'specialtyId' }));

  const finish = (updated: AdminUserDetail, message: string) => {
    syncUser(queryClient, updated);
    show({ message, tone: 'success' });
    onBack();
  };

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      if (profile) {
        const changes = Object.fromEntries(
          DOCTOR_FIELDS.filter((field) => dirtyFields[field]).map((field) => [field, values[field]]),
        );
        finish(await usersApi.updateDoctorProfile(user.id, changes), 'Perfil de médico atualizado.');
      } else
        finish(
          await usersApi.createDoctorProfile(user.id, values),
          `${user.fullName} agora tem perfil de médico.`,
        );
    }),
  );

  return (
    <FormShell
      label={profile ? 'Dados profissionais' : 'Tornar médico'}
      onSubmit={onSubmit}
      alert={alert}
      submitting={isSubmitting}
      onCancel={onBack}
      submitLabel={profile ? 'Salvar alterações' : 'Tornar médico'}
      submitDisabled={locked || catalog.loading || catalog.error !== null || (profile !== null && !isDirty)}
    >
      <p className="text-text-secondary text-sm">
        {profile
          ? 'Mudar a especialidade ou a unidade só é possível sem consultas futuras.'
          : 'Preencha os dados profissionais para dar o perfil de médico a esta conta.'}
      </p>
      <Input label="Nome" value={user.fullName} readOnly icon={<LuUser />} />
      <DoctorProfileFields
        catalog={catalog}
        fields={{
          specialtyId: register('specialtyId'),
          registryNumber: register('registryNumber'),
          registryUf: register('registryUf'),
          unitId: register('unitId'),
        }}
        errors={{
          specialtyId: errors.specialtyId?.message,
          registryNumber: errors.registryNumber?.message,
          registryUf: errors.registryUf?.message,
          unitId: errors.unitId?.message,
        }}
        disabled={locked}
        autoFocus
      />
      {profile && (
        <Button
          variant="danger-outline"
          icon={<LuTrash2 />}
          disabled={locked}
          onClick={onRemove}
          className="self-start"
        >
          Remover perfil de médico
        </Button>
      )}
    </FormShell>
  );
}
