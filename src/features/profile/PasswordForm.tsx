import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { NewPasswordFields } from '@components/forms/NewPasswordFields';
import { Button, FormAlert, PasswordInput, useToast, SectionCard } from '@components/ui';
import { handleProtectedAccount } from '@lib/auth/protected-account';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { changePassword } from './profile-api';
import { passwordSchema, type PasswordValues } from './profile-schemas';

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
  const { alert, run } = useFormSubmit(
    setError,
    ['currentPassword', 'password', 'passwordConfirmation'],
    handleProtectedAccount(onProtected, () => reset(emptyPassword)),
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
    <SectionCard title="Senha" description="Ao trocar a senha, as outras sessões da conta são encerradas.">
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
        <PasswordInput
          label="Senha atual"
          autoComplete="current-password"
          disabled={locked}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <NewPasswordFields
          password={register('password')}
          confirmation={register('passwordConfirmation')}
          errors={{ password: errors.password?.message, confirmation: errors.passwordConfirmation?.message }}
          disabled={locked}
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" loading={isSubmitting} disabled={locked} className="self-start">
          Trocar senha
        </Button>
      </form>
    </SectionCard>
  );
}
