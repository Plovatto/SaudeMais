import { LuMail } from 'react-icons/lu';
import { Input, type InputProps } from '@components/ui';

export function EmailInput(props: Omit<InputProps, 'label' | 'type' | 'icon' | 'inputMode'>) {
  return (
    <Input
      label="E-mail"
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="seu@email.com"
      icon={<LuMail />}
      {...props}
    />
  );
}
