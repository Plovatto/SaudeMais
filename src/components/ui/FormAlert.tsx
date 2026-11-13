import type { ReactNode } from 'react';
import { LuCircleAlert } from 'react-icons/lu';
import { IconSlot } from './IconSlot';

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-tile bg-danger-soft text-danger-text flex items-start gap-2 p-3 text-sm font-medium"
    >
      <IconSlot className="mt-0.5">
        <LuCircleAlert />
      </IconSlot>
      {children}
    </p>
  );
}
