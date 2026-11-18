import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { NewPasswordFields } from '@components/forms/NewPasswordFields';
import { PasswordStrength } from '@components/forms/PasswordStrength';
import { FormShell } from '@components/forms/FormShell';
import { Drawer, PasswordInput, useToast } from '@components/ui';
import { useFormSubmit } from '@hooks/useFormSubmit';
import { useReportSubmitting } from '@hooks/useReportSubmitting';
import { queryKeys } from '@lib/query-keys';
import { changePassword } from './profile-api';
import { passwordSchema, type PasswordValues } from './profile-schemas';

const emptyPassword: PasswordValues = { currentPassword: '', password: '', passwordConfirmation: '' };

interface PasswordFormProps {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}

function PasswordForm({ onClose, onSubmittingChange }: PasswordFormProps) {
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
  useReportSubmitting(isSubmitting, onSubmittingChange);

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

export interface PasswordDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function PasswordDrawer({ open, onClose }: PasswordDrawerProps) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Drawer open={open} onClose={onClose} title="Alterar senha" dismissible={!submitting}>
      {open && <PasswordForm onClose={onClose} onSubmittingChange={setSubmitting} />}
    </Drawer>
  );
}
