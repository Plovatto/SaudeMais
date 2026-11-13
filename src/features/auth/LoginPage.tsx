import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { Button, Checkbox, FormAlert, PasswordInput, TextLink } from '@components/ui';
import { startSession } from '@lib/auth/session';
import { applyApiErrors } from '@lib/form-errors';
import { login } from './auth-api';
import { loginSchema, type LoginValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { EmailInput } from './EmailInput';
import { TestAccounts } from './TestAccounts';

export function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { email?: string } | null };
  const [alert, setAlert] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: state?.email ?? '', password: '', remember: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      const session = await login(values);
      startSession(session.token);
      const multiRole = session.user.roles.some((role) => role !== 'patient');
      await navigate(multiRole ? '/perfis' : '/paciente');
    } catch (error) {
      setAlert(applyApiErrors(error, setError, ['email', 'password']));
    }
  });

  return (
    <AuthScreen
      title="Saúde+"
      subtitle="Faça login para acessar sua conta"
      withLogo
      footer={
        <TestAccounts
          onFill={({ email, password }) => {
            setValue('email', email, { shouldValidate: true });
            setValue('password', password, { shouldValidate: true });
          }}
        />
      }
    >
      <form
        noValidate
        aria-label="Entrar"
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-5"
      >
        <EmailInput autoComplete="username" error={errors.email?.message} {...register('email')} />
        <PasswordInput label="Senha" error={errors.password?.message} {...register('password')} />
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <Checkbox label="Lembrar de mim" {...register('remember')} />
          <TextLink to="/esqueci-senha" className="text-sm">
            Esqueceu a senha?
          </TextLink>
        </div>
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Entrar
        </Button>
        <AuthFooterLink question="Não tem uma conta?" label="Cadastre-se aqui" to="/cadastro" />
      </form>
    </AuthScreen>
  );
}
