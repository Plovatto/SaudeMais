import type { ReactNode } from 'react';
import { PageTitle } from '@components/layout/PageTitle';
import { IconSlot } from '@components/ui';

export interface ErrorScreenProps {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}

export function ErrorScreen({ icon, title, description, action }: ErrorScreenProps) {
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <IconSlot badge="soft">{icon}</IconSlot>
      <PageTitle>{title}</PageTitle>
      <p className="text-text-secondary max-w-sm">{description}</p>
      {action}
    </section>
  );
}
