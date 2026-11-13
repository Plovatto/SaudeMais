import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button, FormAlert, PasswordInput, useToast } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { changePassword } from './profile-api';
import { passwordSchema, type PasswordValues } from './profile-schemas';
import { ProfileSection } from './ProfileSection';
import { useProfileSubmit } from './useProfileSubmit';

const emptyPassword: PasswordValues = { currentPassword: '', password: '', passwordConfirmation: '' };

export function PasswordForm({ locked, onProtected }: { locked: boolean; onProtected: () => void }) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: emptyPassword });
  const { alert, run } = useProfileSubmit(
    setError,
    ['currentPassword', 'password', 'passwordConfirmation'],
    onProtected,
  );

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      await changePassword(values);
      reset(emptyPassword);
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      show({ message: 'Senha alterada. As outras sessões foram encerradas.', tone: 'success' });
    }),
  );

  return (
    <ProfileSection title="Senha" description="Ao trocar a senha, as outras sessões da conta são encerradas.">
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
        <PasswordInput
          label="Senha atual"
          autoComplete="current-password"
          disabled={locked}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordInput
          label="Nova senha"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
          disabled={locked}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirmar nova senha"
          autoComplete="new-password"
          disabled={locked}
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" loading={isSubmitting} disabled={locked} className="self-start">
          Trocar senha
        </Button>
      </form>
    </ProfileSection>
  );
}
