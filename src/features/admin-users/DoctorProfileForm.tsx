import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { LuTrash2, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { Button, FormAlert, Input, SectionCard, Select, Skeleton, useToast } from '@components/ui';
import { UFS } from '@constants/ufs';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { ImpactDialog } from './ImpactDialog';
import { countOf } from './user-text';
import { ADMIN_USERS_PATH, refreshUser, syncUser } from './user-cache';
import { userMessages } from './user-messages';
import { doctorProfileSchema, type DoctorProfileValues } from './user-schemas';
import { catalogApi, usersApi, type AdminUserDetail, type DeactivationImpact } from './users-api';

const FIELDS = ['specialtyId', 'registryNumber', 'registryUf', 'unitId'] as const;

interface Choice {
  id: string;
  name: string;
}

const withCurrent = <T extends Choice>(active: T[], current: Choice | undefined): Choice[] =>
  current && !active.some((item) => item.id === current.id)
    ? [...active, { id: current.id, name: `${current.name} (desativada)` }]
    : active;

const describeRemoval = ({ futureAppointmentsAsDoctor }: DeactivationImpact) =>
  futureAppointmentsAsDoctor > 0
    ? `${countOf(futureAppointmentsAsDoctor, 'consulta futura será cancelada', 'consultas futuras serão canceladas')}. A conta continua como paciente.`
    : 'Não há consultas futuras para cancelar. A conta continua como paciente.';

export interface DoctorProfileFormProps {
  user: AdminUserDetail;
  locked: boolean;
}

export function DoctorProfileForm({ user, locked }: DoctorProfileFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { show } = useToast();
  const profile = user.doctorProfile;
  const [removing, setRemoving] = useState(false);
  const specialties = useQuery({
    queryKey: queryKeys.catalog.activeSpecialties,
    queryFn: ({ signal }) => catalogApi.specialties(signal),
    select: (items) => items.filter((item) => item.isActive),
  });
  const units = useQuery({
    queryKey: queryKeys.catalog.activeUnits,
    queryFn: ({ signal }) => catalogApi.units(signal),
    select: (items) => items.filter((item) => item.isActive),
  });
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
  const { alert, run } = useFormSubmit(setError, FIELDS, undefined, userMessages);
  const specialtyId = useWatch({ control, name: 'specialtyId' });
  const council =
    specialties.data?.find((item) => item.id === specialtyId)?.council ??
    (profile?.specialtyId === specialtyId ? profile.council : undefined);

  const backToUser = () => void navigate(`${ADMIN_USERS_PATH}/${user.id}`);
  const finish = (updated: AdminUserDetail, message: string) => {
    syncUser(queryClient, updated);
    show({ message, tone: 'success' });
    backToUser();
  };

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      if (profile) {
        const changes = Object.fromEntries(
          FIELDS.filter((field) => dirtyFields[field]).map((field) => [field, values[field]]),
        );
        finish(await usersApi.updateDoctorProfile(user.id, changes), 'Perfil de médico atualizado.');
      } else
        finish(
          await usersApi.createDoctorProfile(user.id, values),
          `${user.fullName} agora tem perfil de médico.`,
        );
    }),
  );

  const remove = useMutation({
    mutationFn: () => usersApi.removeDoctorProfile(user.id),
    onSuccess: (updated) => finish(updated, 'Perfil de médico removido.'),
    onError: (error) => {
      refreshUser(queryClient, user.id);
      show({ message: errorMessage(error, userMessages), tone: 'danger' });
    },
    onSettled: () => setRemoving(false),
  });

  const catalogError = specialties.error ?? units.error;
  const loading = specialties.isPending || units.isPending;
  const disabled = locked || catalogError !== null;

  return (
    <SectionCard
      title={profile ? 'Dados profissionais' : 'Tornar médico'}
      description={
        profile
          ? 'Mudar a especialidade ou a unidade só é possível sem consultas futuras.'
          : 'Preencha os dados profissionais para dar o perfil de médico a esta conta.'
      }
    >
      {loading && !catalogError ? (
        <div aria-busy="true">
          <Skeleton className="h-80" />
        </div>
      ) : (
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
          <Input label="Nome" value={user.fullName} readOnly icon={<LuUser />} />
          <Select
            label="Especialidade"
            placeholder="Escolha a especialidade"
            disabled={disabled}
            error={errors.specialtyId?.message}
            {...register('specialtyId')}
          >
            {withCurrent(
              specialties.data ?? [],
              profile && { id: profile.specialtyId, name: profile.specialtyName },
            ).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <Input
              label={council ? `Número do ${council}` : 'Número do registro profissional'}
              inputMode="numeric"
              autoComplete="off"
              hint={council ? undefined : 'O conselho depende da especialidade escolhida.'}
              disabled={disabled}
              error={errors.registryNumber?.message}
              {...register('registryNumber')}
            />
            <Select
              label="UF"
              placeholder="UF"
              disabled={disabled}
              error={errors.registryUf?.message}
              {...register('registryUf')}
            >
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Unidade"
            placeholder="Escolha a unidade"
            disabled={disabled}
            error={errors.unitId?.message}
            {...register('unitId')}
          >
            {withCurrent(units.data ?? [], profile && { id: profile.unitId, name: profile.unitName }).map(
              (item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ),
            )}
          </Select>
          {catalogError && <FormAlert>{errorMessage(catalogError)}</FormAlert>}
          {alert && <FormAlert>{alert}</FormAlert>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={isSubmitting} disabled={disabled || (profile && !isDirty)}>
              {profile ? 'Salvar alterações' : 'Tornar médico'}
            </Button>
            {profile && (
              <Button
                variant="danger"
                icon={<LuTrash2 />}
                disabled={locked}
                onClick={() => setRemoving(true)}
              >
                Remover perfil de médico
              </Button>
            )}
          </div>
        </form>
      )}
      <ImpactDialog
        userId={removing ? user.id : null}
        title={`Remover o perfil de médico de ${user.fullName}?`}
        confirmLabel="Remover perfil"
        describe={describeRemoval}
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setRemoving(false)}
      />
    </SectionCard>
  );
}
