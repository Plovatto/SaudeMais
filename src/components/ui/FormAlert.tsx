import type { ReactNode } from 'react';
import { LuCircleAlert, LuTriangleAlert } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';

const tones = {
  danger: { className: 'bg-danger-soft text-danger-text', icon: <LuCircleAlert /> },
  warning: { className: 'bg-warning-soft text-warning-text', icon: <LuTriangleAlert /> },
};

export interface FormAlertProps {
  tone?: keyof typeof tones;
  role?: 'alert' | 'note';
  children: ReactNode;
}

export function FormAlert({ tone = 'danger', role = 'alert', children }: FormAlertProps) {
  return (
    <p
      role={role}
      className={cx('rounded-tile flex items-start gap-2 p-3 text-sm font-medium', tones[tone].className)}
    >
      <IconSlot className="mt-0.5">{tones[tone].icon}</IconSlot>
      {children}
    </p>
  );
}
