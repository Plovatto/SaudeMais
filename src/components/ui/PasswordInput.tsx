import { useState } from 'react';
import { LuEye, LuEyeOff, LuLock } from 'react-icons/lu';
import { IconButton } from './IconButton';
import { Input, type InputProps } from './Input';

export function PasswordInput(props: Omit<InputProps, 'type' | 'end'>) {
  const [visible, setVisible] = useState(false);
  const shown = visible && !props.disabled;
  return (
    <Input
      icon={<LuLock />}
      autoComplete="current-password"
      {...props}
      type={shown ? 'text' : 'password'}
      end={
        <IconButton
          label="Mostrar senha"
          icon={shown ? <LuEyeOff /> : <LuEye />}
          aria-pressed={shown}
          disabled={props.disabled}
          onClick={() => setVisible((current) => !current)}
          className="unavailable:opacity-100"
        />
      }
    />
  );
}
