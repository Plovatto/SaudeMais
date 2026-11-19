import { useState } from 'react';
import { LuEye, LuEyeOff, LuLock } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { IconButton } from './IconButton';
import { Input, type InputProps } from './Input';

const layer =
  'absolute inset-0 size-full transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]';

const layerState = (active: boolean) =>
  active ? 'scale-100 rotate-0 opacity-100 blur-0' : 'scale-50 -rotate-90 opacity-0 blur-[2px]';

export function PasswordInput(props: Omit<InputProps, 'type' | 'end'>) {
  const [visible, setVisible] = useState(false);
  const shown = visible && !props.disabled;
  return (
    <Input
      icon={<LuLock />}
      autoComplete="current-password"
      placeholder="Digite sua senha"
      {...props}
      type={shown ? 'text' : 'password'}
      end={
        <IconButton
          label="Mostrar senha"
          icon={
            <span className="relative block size-[1em]">
              <LuEye className={cx(layer, layerState(!shown))} />
              <LuEyeOff className={cx(layer, layerState(shown))} />
            </span>
          }
          aria-pressed={shown}
          disabled={props.disabled}
          onClick={() => setVisible((current) => !current)}
          className="aria-pressed:text-role-strong pressable:scale-90 unavailable:opacity-100 transition-[color,background-color,transform] duration-200"
        />
      }
    />
  );
}
