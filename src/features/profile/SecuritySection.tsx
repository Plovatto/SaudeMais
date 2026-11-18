import { LuKeyRound } from 'react-icons/lu';
import { Button, SectionCard, SettingRow } from '@components/ui';
import { tile } from '@components/ui/styles';
import { passwordChangeText } from './profile-text';

export interface SecuritySectionProps {
  passwordChangedAt: string | null | undefined;
  onChangePassword: () => void;
}

export function SecuritySection({ passwordChangedAt, onChangePassword }: SecuritySectionProps) {
  return (
    <SectionCard title="Segurança" className="lg:flex-1">
      <SettingRow
        className="gap-4 py-3.5"
        leading={
          <span aria-hidden className={tile}>
            <LuKeyRound />
          </span>
        }
        title="Senha"
        meta={passwordChangeText(passwordChangedAt)}
        trailing={
          <Button
            variant="secondary"
            size="sm"
            onClick={onChangePassword}
            aria-label="Alterar senha"
            aria-haspopup="dialog"
          >
            Alterar
          </Button>
        }
      />
    </SectionCard>
  );
}
