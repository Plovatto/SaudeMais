import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { Button, FormAlert, PasswordInput, TextLink, useToast } from '@components/ui';
import { ApiError } from '@lib/api/api-error';
import { endSession, sessionToken } from '@lib/auth/session';
import { applyApiErrors } from '@lib/form-errors';
import { confirmPasswordReset } from './auth-api';
import { resetPasswordSchema, type ResetPasswordValues } from './auth-schemas';
import { AuthScreen } from './AuthScreen';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function tokenFrom(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

function InvalidLink() {
  return (
    <FormAlert>
      Este link é inválido ou já venceu. <TextLink to="/esqueci-senha">Peça um novo link</TextLink>.
    </FormAlert>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { pathname, search, hash } = useLocation();
  const [token] = useState(() => tokenFrom(hash));
  const [invalid, setInvalid] = useState(token === null);
  const [alert, setAlert] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  });

  useEffect(() => {
    if (hash) void navigate({ pathname, search }, { replace: true });
  }, [hash, pathname, search, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    setAlert(null);
    try {
      await confirmPasswordReset(token, values);
      if (sessionToken()) endSession('signed-out');
      show({ message: 'Senha redefinida. Entre com a nova senha.', tone: 'success' });
      await navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_RESET_TOKEN') setInvalid(true);
      else setAlert(applyApiErrors(error, setError, ['password', 'passwordConfirmation']));
    }
  });

  return (
    <AuthScreen title="Criar nova senha" subtitle="Escolha uma senha nova para a sua conta">
      {invalid ? (
        <InvalidLink />
      ) : (
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
          <PasswordInput
            label="Nova senha"
            autoComplete="new-password"
            hint="Pelo menos 8 caracteres."
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Confirmar nova senha"
            autoComplete="new-password"
            error={errors.passwordConfirmation?.message}
            {...register('passwordConfirmation')}
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
