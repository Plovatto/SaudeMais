import type { UseFormRegisterReturn } from 'react-hook-form';
import { LuPhone, LuUser } from 'react-icons/lu';
import { Input, type InputProps } from '@components/ui';

export interface PersonalDataFieldsProps {
  fullName: UseFormRegisterReturn;
  phone: UseFormRegisterReturn;
  errors: { fullName?: string | undefined; phone?: string | undefined };
  locked?: boolean;
  ownAccount: boolean;
  phoneHint?: string;
}

export function PersonalDataFields({
  fullName,
  phone,
  errors,
  locked,
  ownAccount,
  phoneHint = 'Opcional, com DDD. Deixe em branco para remover.',
}: PersonalDataFieldsProps) {
  return (
    <>
      <Input
        label="Nome completo"
        autoComplete={ownAccount ? 'name' : 'off'}
        icon={<LuUser />}
        disabled={locked}
        error={errors.fullName}
        {...fullName}
      />
      <Input
        label="Telefone"
        type="tel"
        autoComplete={ownAccount ? 'tel' : 'off'}
        inputMode="tel"
        placeholder="(99) 99999-9999"
        hint={phoneHint}
        icon={<LuPhone />}
        disabled={locked}
        error={errors.phone}
        {...phone}
      />
    </>
  );
}

export interface ReadOnlyEmailFieldProps extends Pick<InputProps, 'icon' | 'end'> {
  email: string;
  hint: string;
}

export function ReadOnlyEmailField({ email, ...props }: ReadOnlyEmailFieldProps) {
  return <Input label="E-mail" type="email" value={email} readOnly {...props} />;
}
