import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormAlert } from '@components/ui';
import { applyApiErrors } from '@lib/form-errors';
import { requestPasswordReset } from './auth-api';
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { EmailInput } from './EmailInput';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await requestPasswordReset(values);
      setSentTo(values.email);
    } catch (error) {
      setAlert(applyApiErrors(error, setError, ['email']));
    }
  });

  return (
    <AuthScreen title="Esqueceu a senha?" subtitle="Enviamos um link para você criar uma nova senha">
      {sentTo ? (
        <p role="status" className="text-text text-sm">
          Se houver uma conta com o e-mail <strong className="break-all">{sentTo}</strong>, enviamos um link
          para criar uma nova senha. O link vale por 30 minutos. Confira também a caixa de spam.
        </p>
      ) : (
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
          <EmailInput autoComplete="username" error={errors.email?.message} {...register('email')} />
          {alert && <FormAlert>{alert}</FormAlert>}
          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}
      <AuthFooterLink question="Lembrou a senha?" label="Voltar ao login" to="/login" />
    </AuthScreen>
  );
}
