import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuPhone, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { NewPasswordFields } from '@components/forms/NewPasswordFields';
import { Button, Checkbox, FormAlert, Input, TextLink, useToast } from '@components/ui';
import { useFormSubmit } from '@hooks/useFormSubmit';
import { track } from '@lib/analytics';
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
      track('sign_up');
      show({ message: 'Conta criada. Entre com seu e-mail e senha.', tone: 'success' });
      await navigate('/login', { state: { email: user.email } });
    }),
  );

  return (
    <AuthScreen
      art={{
        title: 'Sua conta pronta em poucos minutos.',
        text: 'Cadastre-se para agendar consultas e exames e acompanhar seus resultados.',
      }}
      title="Criar conta"
      subtitle="Preencha os dados para se cadastrar."
      wide
    >
      <form
        noValidate
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-5 xl:grid xl:grid-cols-2 xl:gap-x-4"
      >
        <Input
          label="Nome completo"
          className="xl:col-span-2"
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
          labelNote="Opcional"
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
        <div className="flex flex-col gap-5 xl:col-span-2">
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
          <AuthFooterLink question="Já tem conta?" label="Entrar" to="/login" />
        </div>
      </form>
    </AuthScreen>
  );
}
