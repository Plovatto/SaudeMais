import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { NewPasswordFields } from '@components/forms/NewPasswordFields';
import { Button, FormAlert, TextLink, useToast } from '@components/ui';
import { ApiError } from '@lib/api/api-error';
import { endSession, sessionToken } from '@lib/auth/session';
import { useFormSubmit } from '@lib/useFormSubmit';
import { confirmPasswordReset } from './auth-api';
import { resetPasswordSchema, type ResetPasswordValues } from './auth-schemas';
import { AuthScreen } from './AuthScreen';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function tokenFrom(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { pathname, search, hash } = useLocation();
  const [token] = useState(() => tokenFrom(hash));
  const [invalid, setInvalid] = useState(token === null);
  const [focusInvalid, setFocusInvalid] = useState(false);
  const invalidAlert = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  });
  const { alert, run } = useFormSubmit(setError, ['password', 'passwordConfirmation'], (error) => {
    if (!(error instanceof ApiError) || error.code !== 'INVALID_RESET_TOKEN') return false;
    setInvalid(true);
    setFocusInvalid(true);
    return true;
  });

  useEffect(() => {
    if (hash) void navigate({ pathname, search }, { replace: true });
  }, [hash, pathname, search, navigate]);

  useEffect(() => {
    if (focusInvalid) invalidAlert.current?.focus();
  }, [focusInvalid]);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      if (!token) return;
      await confirmPasswordReset(token, values);
      if (sessionToken()) endSession('signed-out');
      show({ message: 'Senha redefinida. Entre com a nova senha.', tone: 'success' });
      await navigate('/login', { replace: true });
    }),
  );

  return (
    <AuthScreen title="Criar nova senha" subtitle="Escolha uma senha nova para a sua conta">
      {invalid ? (
        <div ref={invalidAlert} tabIndex={-1} className="focus-visible:outline-none">
          <FormAlert>
            Este link é inválido ou já venceu. <TextLink to="/esqueci-senha">Peça um novo link</TextLink>.
          </FormAlert>
        </div>
      ) : (
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
          <NewPasswordFields
            password={register('password')}
            confirmation={register('passwordConfirmation')}
            errors={{
              password: errors.password?.message,
              confirmation: errors.passwordConfirmation?.message,
            }}
          />
          {alert && <FormAlert>{alert}</FormAlert>}
          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
