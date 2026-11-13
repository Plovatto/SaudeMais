import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuPhone, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { NewPasswordFields } from '@components/forms/NewPasswordFields';
import { Button, Checkbox, FormAlert, Input, TextLink, useToast } from '@components/ui';
import { useFormSubmit } from '@lib/useFormSubmit';
import { register as createAccount } from './auth-api';
import { registerSchema, type RegisterValues } from './auth-schemas';
import { AuthFooterLink } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';
import { EmailInput } from './EmailInput';

const apiFields = ['fullName', 'email', 'phone', 'password', 'passwordConfirmation', 'acceptTerms'] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const { show } = useToast();
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
  const { alert, run } = useFormSubmit(setError, apiFields);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      const user = await createAccount(values);
      show({ message: 'Conta criada. Entre com seu e-mail e senha.', tone: 'success' });
      await navigate('/login', { state: { email: user.email } });
    }),
  );

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
        <NewPasswordFields
          variant="create"
          password={register('password')}
          confirmation={register('passwordConfirmation')}
          errors={{ password: errors.password?.message, confirmation: errors.passwordConfirmation?.message }}
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
