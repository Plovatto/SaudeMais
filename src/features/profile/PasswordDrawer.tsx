import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { NewPasswordFields } from '@components/forms/NewPasswordFields';
import { PasswordStrength } from '@components/forms/PasswordStrength';
import { FormShell } from '@components/forms/FormShell';
import { Drawer, PasswordInput, useToast } from '@components/ui';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { changePassword } from './profile-api';
import { passwordSchema, type PasswordValues } from './profile-schemas';

const emptyPassword: PasswordValues = { currentPassword: '', password: '', passwordConfirmation: '' };

interface PasswordFormProps {
  onClose: () => void;
}

function PasswordForm({ onClose }: PasswordFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: emptyPassword });
  const values = useWatch({ control });
  const canSubmit = passwordSchema.safeParse(values).success;
  const { alert, run } = useFormSubmit(setError, ['currentPassword', 'password', 'passwordConfirmation']);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      await changePassword(values);
      onClose();
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      show({ message: 'Senha alterada. As outras sessões foram encerradas.', tone: 'success' });
    }),
  );

  return (
    <FormShell
      label="Alterar senha"
      onSubmit={onSubmit}
      alert={alert}
      submitting={isSubmitting}
      onCancel={onClose}
      submitLabel="Alterar senha"
      submitDisabled={!canSubmit}
    >
      <PasswordInput
        label="Senha atual"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <NewPasswordFields
        password={register('password')}
        confirmation={register('passwordConfirmation')}
        errors={{ password: errors.password?.message, confirmation: errors.passwordConfirmation?.message }}
        showHint={false}
      />
      <PasswordStrength password={values.password ?? ''} current={values.currentPassword ?? ''} />
      <p className="text-text-muted text-xs">Ao trocar a senha, as outras sessões da conta são encerradas.</p>
    </FormShell>
  );
}

export function PasswordDrawer({ open, ...props }: PasswordFormProps & { open: boolean }) {
  return (
    <Drawer open={open} onClose={props.onClose} title="Alterar senha">
      {open && <PasswordForm {...props} />}
    </Drawer>
  );
}
