import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { LuSend } from 'react-icons/lu';
import { Button, FormAlert, useToast } from '@components/ui';
import { useCooldown } from '@hooks/useCooldown';
import { useFormSubmit } from '@hooks/useFormSubmit';
import { requestPasswordReset } from './auth-api';
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { EmailInput } from './EmailInput';

const RESEND_SECONDS = 30;

export function ForgotPasswordPage() {
  const { show } = useToast();
  const { remaining: wait, start: startWait } = useCooldown(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
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
      startWait();
    }),
  );

  const resend = async () => {
    if (!sentTo) return;
    setResending(true);
    await run(async () => {
      await requestPasswordReset({ email: sentTo });
      startWait();
      show({ message: 'Link reenviado.', tone: 'success' });
    });
    setResending(false);
  };

  return (
    <AuthScreen
      art={{
        title: 'Acontece com todo mundo.',
        text: 'Enviamos um link seguro para o seu e-mail e você cria uma nova senha em instantes.',
      }}
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
    >
      <div role="status">
        {sentTo && (
          <p ref={confirmation} tabIndex={-1} className="text-text text-sm focus-visible:outline-none">
            Enviamos para <strong className="break-all">{sentTo}</strong> um link para criar uma nova senha. O
            link vale por 30 minutos. Confira também a caixa de spam.
          </p>
        )}
      </div>
      {sentTo && (
        <div className="flex flex-col gap-4">
          {alert && <FormAlert>{alert}</FormAlert>}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            icon={<LuSend />}
            loading={resending}
            disabled={wait > 0}
            onClick={() => void resend()}
          >
            {wait > 0 ? `Reenviar e-mail em ${wait}s` : 'Reenviar e-mail'}
          </Button>
        </div>
      )}
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
