import type { UseFormRegisterReturn } from 'react-hook-form';
import { PasswordInput } from '@components/ui';
import { PASSWORD_MIN } from '@lib/validation/account-fields';

const labels = {
  create: {
    password: 'Senha',
    confirmation: 'Confirmar senha',
    passwordHolder: 'Crie uma senha',
    confirmationHolder: 'Repita a senha',
  },
  change: {
    password: 'Nova senha',
    confirmation: 'Confirmar nova senha',
    passwordHolder: 'Digite a nova senha',
    confirmationHolder: 'Repita a nova senha',
  },
};

export interface NewPasswordFieldsProps {
  password: UseFormRegisterReturn;
  confirmation: UseFormRegisterReturn;
  errors: { password?: string | undefined; confirmation?: string | undefined };
  variant?: keyof typeof labels;
  disabled?: boolean;
  showHint?: boolean;
}

export function NewPasswordFields({
  password,
  confirmation,
  errors,
  variant = 'change',
  disabled,
  showHint = true,
}: NewPasswordFieldsProps) {
  return (
    <>
      <PasswordInput
        label={labels[variant].password}
        placeholder={labels[variant].passwordHolder}
        autoComplete="new-password"
        hint={showHint ? `Pelo menos ${PASSWORD_MIN} caracteres.` : undefined}
        disabled={disabled}
        error={errors.password}
        {...password}
      />
      <PasswordInput
        label={labels[variant].confirmation}
        placeholder={labels[variant].confirmationHolder}
        autoComplete="new-password"
        disabled={disabled}
        error={errors.confirmation}
        {...confirmation}
      />
    </>
  );
}
