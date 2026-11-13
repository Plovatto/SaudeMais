import type { UseFormRegisterReturn } from 'react-hook-form';
import { PasswordInput } from '@components/ui';

const labels = {
  create: { password: 'Senha', confirmation: 'Confirmar senha' },
  change: { password: 'Nova senha', confirmation: 'Confirmar nova senha' },
};

export interface NewPasswordFieldsProps {
  password: UseFormRegisterReturn;
  confirmation: UseFormRegisterReturn;
  errors: { password?: string | undefined; confirmation?: string | undefined };
  variant?: keyof typeof labels;
  disabled?: boolean;
}

export function NewPasswordFields({
  password,
  confirmation,
  errors,
  variant = 'change',
  disabled,
}: NewPasswordFieldsProps) {
  return (
    <>
      <PasswordInput
        label={labels[variant].password}
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        disabled={disabled}
        error={errors.password}
        {...password}
      />
      <PasswordInput
        label={labels[variant].confirmation}
        autoComplete="new-password"
        disabled={disabled}
        error={errors.confirmation}
        {...confirmation}
      />
    </>
  );
}
