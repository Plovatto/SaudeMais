import type { ReactNode } from 'react';
import { TextLink } from '@components/ui';
import { hitArea } from '@components/ui/styles';

export function AuthFooter({ children }: { children: ReactNode }) {
  return <p className="text-text-secondary text-center text-[0.8125rem]">{children}</p>;
}

export function AuthFooterLink({ question, label, to }: { question: string; label: string; to: string }) {
  return (
    <AuthFooter>
      {question}{' '}
      <TextLink to={to} className={hitArea}>
        {label}
      </TextLink>
    </AuthFooter>
  );
}
