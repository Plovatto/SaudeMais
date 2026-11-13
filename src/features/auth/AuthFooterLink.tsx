import { TextLink } from '@components/ui';

export function AuthFooterLink({ question, label, to }: { question: string; label: string; to: string }) {
  return (
    <p className="text-text-secondary text-center text-sm">
      {question} <TextLink to={to}>{label}</TextLink>
    </p>
  );
}
