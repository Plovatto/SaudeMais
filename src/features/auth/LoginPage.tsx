import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { PAGE_TITLE_ID } from '@components/layout/PageTitle';
import { Button, Checkbox, FormAlert, PasswordInput, TextLink } from '@components/ui';
import { hitArea } from '@components/ui/styles';
import { homeFor } from '@lib/auth/return-to';
import { acknowledgeSessionExpiry, startSession } from '@lib/auth/session';
import { sessionQuery } from '@lib/auth/useSession';
import { cx } from '@lib/cx';
import { applyApiErrors } from '@lib/form-errors';
import { login } from './auth-api';
import { loginSchema, type LoginValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { DemoAccounts } from './DemoAccounts';
import { EmailInput } from './EmailInput';

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { state } = useLocation() as { state: { email?: string; expired?: boolean } | null };
  const [alert, setAlert] = useState<string | null>(
    state?.expired ? 'Sua sessão expirou. Entre novamente.' : null,
  );
  const { pathname, search } = useLocation();
  useEffect(() => {
    acknowledgeSessionExpiry();
    if (state?.expired) void navigate({ pathname, search }, { replace: true, state: null });
  }, [state, pathname, search, navigate]);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: state?.email ?? '', password: '', remember: false },
  });

  const email = useWatch({ control, name: 'email' });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      const session = await login(values);
      startSession(session.token, values.remember);
      queryClient.setQueryData(sessionQuery.queryKey, {
        birthDate: null,
        passwordChangedAt: null,
        ...session.user,
      });
      void queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey });
      await navigate(homeFor(session.user.roles, params.get('returnTo')), { replace: true });
    } catch (error) {
      setAlert(applyApiErrors(error, setError, ['email', 'password']));
    }
  });

  return (
    <AuthScreen
      art={{
        title: 'Sua saúde, seus horários, em um só lugar.',
        text: 'Agende consultas, acompanhe exames e receba os resultados sem sair de casa.',
      }}
      title="Entrar"
      subtitle="Use seu e-mail e senha da clínica."
    >
      <form
        noValidate
        aria-labelledby={PAGE_TITLE_ID}
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-5"
      >
        <EmailInput autoComplete="username" error={errors.email?.message} {...register('email')} />
        <div className="flex flex-col gap-1">
          <PasswordInput label="Senha" error={errors.password?.message} {...register('password')} />
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <Checkbox label="Lembrar de mim" {...register('remember')} />
            <TextLink to="/esqueci-senha" className={cx(hitArea, 'text-[0.8125rem]')}>
              Esqueci a senha
            </TextLink>
          </div>
        </div>
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Entrar
        </Button>
        <AuthFooterLink question="Não tem conta?" label="Cadastre-se" to="/cadastro" />
      </form>
      <DemoAccounts
        selected={email}
        onFill={(account) => {
          setValue('email', account.email, { shouldValidate: true });
          setValue('password', account.password, { shouldValidate: true });
        }}
      />
    </AuthScreen>
  );
}
