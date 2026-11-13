import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LuPhone, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { Button, Checkbox, FormAlert, Input, PasswordInput, TextLink, useToast } from '@components/ui';
import { applyApiErrors } from '@lib/form-errors';
import { register as createAccount } from './auth-api';
import { registerSchema, type RegisterValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { EmailInput } from './EmailInput';

const apiFields = ['fullName', 'email', 'phone', 'password', 'passwordConfirmation', 'acceptTerms'] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [alert, setAlert] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      acceptTerms: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      const user = await createAccount(values);
      show({ message: 'Conta criada. Entre com seu e-mail e senha.', tone: 'success' });
      await navigate('/login', { state: { email: user.email } });
    } catch (error) {
      setAlert(applyApiErrors(error, setError, apiFields));
    }
  });

  return (
    <AuthScreen title="Criar conta" subtitle="Preencha os dados para se cadastrar">
      <FormAlert tone="warning" role="note">
        Ambiente de demonstração: não use dados reais.
      </FormAlert>
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
        <Input
          label="Nome completo"
          autoComplete="name"
          placeholder="Seu nome completo"
          icon={<LuUser />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <EmailInput error={errors.email?.message} {...register('email')} />
        <Input
          label="Telefone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(99) 99999-9999"
          hint="Opcional, com DDD."
          icon={<LuPhone />}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <PasswordInput
          label="Senha"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirmar senha"
          autoComplete="new-password"
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />
        <Checkbox
          label={
            <>
              Aceito os{' '}
              <TextLink to="/termos" newTab>
                termos de uso
              </TextLink>{' '}
              e a{' '}
              <TextLink to="/privacidade" newTab>
                política de privacidade
              </TextLink>
            </>
          }
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Cadastrar-se
        </Button>
        <AuthFooterLink question="Já tem uma conta?" label="Faça login aqui" to="/login" />
      </form>
    </AuthScreen>
  );
}
