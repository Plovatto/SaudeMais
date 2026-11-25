import { LuKeyRound, LuLogOut } from 'react-icons/lu';
import { Button, SectionCard, SettingRow } from '@components/ui';
import { tile } from '@components/ui/styles';
import { passwordChangeText } from './profile-text';

export interface SecuritySectionProps {
  passwordChangedAt: string | null | undefined;
  onChangePassword: () => void;
  onLogout: () => void;
}

export function SecuritySection({ passwordChangedAt, onChangePassword, onLogout }: SecuritySectionProps) {
  return (
    <SectionCard title="Segurança">
      <ul className="-my-2 flex flex-col">
        <SettingRow
          as="li"
          className="border-border gap-4 py-3.5 not-first:border-t"
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
        <SettingRow
          as="li"
          className="border-border gap-4 py-3.5 not-first:border-t"
          leading={
            <span aria-hidden className={tile}>
              <LuLogOut />
            </span>
          }
          title="Sair da conta"
          meta="Encerra a sessão neste aparelho"
          trailing={
            <Button
              variant="danger-soft-outline"
              size="sm"
              onClick={onLogout}
              aria-label="Sair da conta"
              aria-haspopup="dialog"
            >
              Sair
            </Button>
          }
        />
      </ul>
    </SectionCard>
  );
}
