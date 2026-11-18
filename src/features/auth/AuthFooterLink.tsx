import type { ReactNode } from 'react';
import { TextLink } from '@components/ui';

export function AuthFooter({ children }: { children: ReactNode }) {
  return <p className="text-text-secondary text-center text-[0.8125rem]">{children}</p>;
}

export function AuthFooterLink({ question, label, to }: { question: string; label: string; to: string }) {
  return (
    <AuthFooter>
      {question} <TextLink to={to}>{label}</TextLink>
    </AuthFooter>
  );
}
