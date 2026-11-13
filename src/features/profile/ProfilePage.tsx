import { useState } from 'react';
import { LuLogOut, LuRepeat } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, ButtonLink, FormAlert } from '@components/ui';
import { DEMO_PATIENT } from '@constants/demo-accounts';
import { useCurrentUser } from '@lib/auth/useSession';
import { useSignOut } from '@lib/auth/useSignOut';
import { PasswordForm } from './PasswordForm';
import { PersonalDataForm } from './PersonalDataForm';
import { ProfileSection } from './ProfileSection';
import { SessionsSection } from './SessionsSection';

export function ProfilePage() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const [locked, setLocked] = useState(user.email === DEMO_PATIENT.email);
  const lock = () => setLocked(true);

  return (
    <>
      <PageHeader title="Meu perfil" />
      <div className="flex flex-col gap-6">
        {locked && (
          <FormAlert tone="warning" role="note">
            Esta é uma conta de demonstração, compartilhada com outros visitantes. Os dados e a senha não
            podem ser alterados.
          </FormAlert>
        )}
        <PersonalDataForm user={user} locked={locked} onProtected={lock} />
        <PasswordForm locked={locked} onProtected={lock} />
        <SessionsSection />
        <ProfileSection title="Conta">
          <div className="flex flex-wrap gap-3">
            {user.roles.length > 1 && (
              <ButtonLink to="/perfis" variant="secondary">
                <LuRepeat aria-hidden />
                Trocar perfil
              </ButtonLink>
            )}
            <Button variant="danger" icon={<LuLogOut />} onClick={() => void signOut()}>
              Sair
            </Button>
          </div>
        </ProfileSection>
      </div>
    </>
  );
}
