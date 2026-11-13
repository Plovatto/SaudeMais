import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { LuMail, LuPhone, LuUser } from 'react-icons/lu';
import { Button, FormAlert, Input, useToast } from '@components/ui';
import type { CurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { updateProfile } from './profile-api';
import { profileSchema, type ProfileValues } from './profile-schemas';
import { ProfileSection } from './ProfileSection';
import { handleProtectedAccount } from './protected-account';

export interface PersonalDataFormProps {
  user: CurrentUser;
  locked: boolean;
  onProtected: () => void;
}

const valuesOf = (user: CurrentUser): ProfileValues => ({ fullName: user.fullName, phone: user.phone ?? '' });

export function PersonalDataForm({ user, locked, onProtected }: PersonalDataFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: valuesOf(user) });
  const { alert, run } = useFormSubmit(
    setError,
    ['fullName', 'phone'],
    handleProtectedAccount(onProtected, () => reset(valuesOf(user))),
  );

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      const updated = await updateProfile(values);
      queryClient.setQueryData(queryKeys.session, updated);
      reset(valuesOf(updated));
      show({ message: 'Dados atualizados.', tone: 'success' });
    }),
  );

  return (
    <ProfileSection title="Seus dados" description="O e-mail é usado para entrar e não pode ser alterado.">
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
        <Input label="E-mail" type="email" value={user.email} readOnly icon={<LuMail />} />
        <Input
          label="Nome completo"
          autoComplete="name"
          icon={<LuUser />}
          disabled={locked}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Telefone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(99) 99999-9999"
          hint="Opcional, com DDD. Deixe em branco para remover."
          icon={<LuPhone />}
          disabled={locked}
          error={errors.phone?.message}
          {...register('phone')}
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" loading={isSubmitting} disabled={locked || !isDirty} className="self-start">
          Salvar alterações
        </Button>
      </form>
    </ProfileSection>
  );
}
