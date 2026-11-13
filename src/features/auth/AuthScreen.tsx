import type { ReactNode } from 'react';
import { Logo } from '@components/layout/Logo';
import { PageTitle } from '@components/layout/PageTitle';
import { Card } from '@components/ui';

export interface AuthScreenProps {
  title: string;
  subtitle: string;
  withLogo?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScreen({ title, subtitle, withLogo = false, children, footer }: AuthScreenProps) {
  return (
    <div className="flex flex-col gap-6 pt-4 pb-6">
      <header className="text-on-role flex flex-col items-center gap-2 text-center">
        {withLogo && <Logo className="mb-4" />}
        <PageTitle className="text-on-role text-[1.75rem] font-bold">{title}</PageTitle>
        <p className="font-medium">{subtitle}</p>
      </header>
      <Card className="flex flex-col gap-5 px-6 py-8 sm:px-10">{children}</Card>
      {footer}
    </div>
  );
}
