import type { ReactNode } from 'react';
import { LuCircleAlert, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { cx } from '@lib/cx';
import { IconSlot } from './IconSlot';
import { softTones } from './styles';

const tones = {
  danger: { className: softTones.danger, icon: <LuCircleAlert /> },
  warning: { className: softTones.warning, icon: <LuTriangleAlert /> },
  info: { className: softTones.info, icon: <LuInfo /> },
  quiet: {
    className: 'bg-surface-muted text-text-secondary border-border border font-normal',
    icon: <LuInfo />,
  },
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
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}
