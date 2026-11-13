import { useState } from 'react';
import { LuEye, LuEyeOff, LuLock } from 'react-icons/lu';
import { IconButton } from './IconButton';
import { Input, type InputProps } from './Input';

export function PasswordInput(props: Omit<InputProps, 'type' | 'end'>) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      icon={<LuLock />}
      autoComplete="current-password"
      {...props}
      type={visible ? 'text' : 'password'}
      end={
        <IconButton
          label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          icon={visible ? <LuEyeOff /> : <LuEye />}
          aria-pressed={visible}
          disabled={props.disabled}
          onClick={() => setVisible((current) => !current)}
        />
      }
    />
  );
}
