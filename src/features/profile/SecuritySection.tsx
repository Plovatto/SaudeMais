import { LuKeyRound } from 'react-icons/lu';
import { Button, SectionCard } from '@components/ui';
import { tile } from '@components/ui/styles';
import { passwordChangeText } from './profile-text';

export interface SecuritySectionProps {
  passwordChangedAt: string | null | undefined;
  onChangePassword: () => void;
}

export function SecuritySection({ passwordChangedAt, onChangePassword }: SecuritySectionProps) {
  return (
    <SectionCard title="Segurança" className="lg:flex-1">
      <div className="flex items-center gap-4 py-3.5">
        <span aria-hidden className={tile}>
          <LuKeyRound />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-text text-sm font-semibold">Senha</p>
          <p className="text-text-secondary text-[0.8125rem]">{passwordChangeText(passwordChangedAt)}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onChangePassword}
          aria-label="Alterar senha"
          aria-haspopup="dialog"
        >
          Alterar
        </Button>
      </div>
    </SectionCard>
  );
}
