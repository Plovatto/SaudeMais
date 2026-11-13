import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormAlert } from '@components/ui';
import { useFormSubmit } from '@lib/useFormSubmit';
import { requestPasswordReset } from './auth-api';
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { EmailInput } from './EmailInput';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { alert, run } = useFormSubmit(setError, ['email']);

  useEffect(() => {
    if (sentTo) confirmation.current?.focus();
  }, [sentTo]);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      await requestPasswordReset(values);
      setSentTo(values.email);
    }),
  );

  return (
    <AuthScreen title="Esqueceu a senha?" subtitle="Enviamos um link para você criar uma nova senha">
      <div role="status">
        {sentTo && (
          <p ref={confirmation} tabIndex={-1} className="text-text text-sm focus-visible:outline-none">
            Se houver uma conta com o e-mail <strong className="break-all">{sentTo}</strong>, enviamos um link
            para criar uma nova senha. O link vale por 30 minutos. Confira também a caixa de spam.
          </p>
        )}
      </div>
      {!sentTo && (
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
