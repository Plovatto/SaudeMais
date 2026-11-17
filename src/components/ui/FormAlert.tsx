import type { ReactNode } from 'react';
import { LuCircleAlert, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';

const tones = {
  danger: { className: 'bg-danger-soft text-danger-text', icon: <LuCircleAlert /> },
  warning: { className: 'bg-warning-soft text-warning-text', icon: <LuTriangleAlert /> },
  info: { className: 'bg-role-soft text-role-text', icon: <LuInfo /> },
};

export interface FormAlertProps {
  tone?: keyof typeof tones;
  role?: 'alert' | 'note';
  icon?: ReactNode;
  children: ReactNode;
}

export function FormAlert({ tone = 'danger', role = 'alert', icon, children }: FormAlertProps) {
  return (
    <p
      role={role}
      className={cx(
        'rounded-tile flex items-start gap-3 px-3.5 py-3 text-[0.8125rem] font-medium',
        tones[tone].className,
      )}
    >
      <IconSlot className="mt-px text-base">{icon ?? tones[tone].icon}</IconSlot>
      {children}
    </p>
  );
}
