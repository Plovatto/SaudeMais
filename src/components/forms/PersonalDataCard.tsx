import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuMail, LuPhone, LuUser } from 'react-icons/lu';
import { Button, FormAlert, Input, SectionCard, useToast } from '@components/ui';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';
import { useFormSubmit } from '@lib/useFormSubmit';
import {
  personalDataSchema,
  personalDataValues,
  type PersonalDataValues,
} from '@lib/validation/account-fields';

interface Person {
  email: string;
  fullName: string;
  phone: string | null;
}

export interface PersonalDataCardProps {
  title: string;
  person: Person;
  locked: boolean;
  ownAccount?: boolean;
  onSave: (values: PersonalDataValues) => Promise<Person>;
  onError?: (error: unknown, resetForm: () => void) => boolean;
  messages?: MessageOverrides;
}

export function PersonalDataCard({
  title,
  person,
  locked,
  ownAccount = false,
  onSave,
  onError,
  messages,
}: PersonalDataCardProps) {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PersonalDataValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: personalDataValues(person),
  });
  const { alert, run } = useFormSubmit(
    setError,
    ['fullName', 'phone'],
    onError && ((error) => onError(error, () => reset(personalDataValues(person)))),
    messages,
  );

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      reset(personalDataValues(await onSave(values)));
      show({ message: 'Dados atualizados.', tone: 'success' });
    }),
  );

  return (
    <SectionCard title={title} description="O e-mail é usado para entrar e não pode ser alterado.">
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
        <Input label="E-mail" type="email" value={person.email} readOnly icon={<LuMail />} />
        <Input
          label="Nome completo"
          autoComplete={ownAccount ? 'name' : 'off'}
          icon={<LuUser />}
          disabled={locked}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Telefone"
          type="tel"
          autoComplete={ownAccount ? 'tel' : 'off'}
          inputMode="tel"
          placeholder="(99) 99999-9999"
          hint="Opcional, com DDD. Deixe em branco para remover."
          icon={<LuPhone />}
          disabled={locked}
          error={errors.phone?.message}
          {...register('phone')}
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" loading={isSubmitting} disabled={locked || !isDirty} className="self-start">
          Salvar alterações
        </Button>
      </form>
    </SectionCard>
  );
}
