import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuMail } from 'react-icons/lu';
import { Button, FormAlert, Input, SectionCard, useToast } from '@components/ui';
import type { MessageOverrides } from '@lib/messages/errors.pt-BR';
import { useFormSubmit } from '@lib/useFormSubmit';
import {
  personalDataSchema,
  personalDataValues,
  type PersonalDataValues,
} from '@lib/validation/account-fields';
import { PersonalDataFields } from './PersonalDataFields';

interface Person {
  email: string;
  fullName: string;
  phone: string | null;
}

export interface PersonalDataCardProps {
  title: string;
  person: Person;
  locked: boolean;
  onSave: (values: PersonalDataValues) => Promise<Person>;
  messages?: MessageOverrides;
}

export function PersonalDataCard({ title, person, locked, onSave, messages }: PersonalDataCardProps) {
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
  const { alert, run } = useFormSubmit(setError, ['fullName', 'phone'], undefined, messages);

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
        <PersonalDataFields
          fullName={register('fullName')}
          phone={register('phone')}
          errors={{ fullName: errors.fullName?.message, phone: errors.phone?.message }}
          locked={locked}
          ownAccount={false}
        />
        {alert && <FormAlert>{alert}</FormAlert>}
        <Button type="submit" loading={isSubmitting} disabled={locked || !isDirty} className="self-start">
          Salvar alterações
        </Button>
      </form>
    </SectionCard>
  );
}
