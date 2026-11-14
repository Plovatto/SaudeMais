import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LuLogOut, LuRepeat } from 'react-icons/lu';
import { PersonalDataCard } from '@components/forms/PersonalDataCard';
import { PageHeader } from '@components/layout/PageHeader';
import { Button, ButtonLink, FormAlert, SectionCard } from '@components/ui';
import { isDemoEmail } from '@constants/demo-accounts';
import { useCurrentUser } from '@lib/auth/useSession';
import { useSignOut } from '@lib/auth/useSignOut';
import { queryKeys } from '@lib/query-keys';
import { PasswordForm } from './PasswordForm';
import { updateProfile } from './profile-api';
import { handleProtectedAccount } from './protected-account';
import { SessionsSection } from './SessionsSection';

export function ProfilePage() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const [locked, setLocked] = useState(isDemoEmail(user.email));
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
        <PersonalDataCard
          title="Seus dados"
          person={user}
          locked={locked}
          ownAccount
          onSave={async (values) => {
            const updated = await updateProfile(values);
            queryClient.setQueryData(queryKeys.session, updated);
            return updated;
          }}
          onError={(error, resetForm) => handleProtectedAccount(lock, resetForm)(error)}
        />
        <PasswordForm locked={locked} onProtected={lock} />
        <SessionsSection />
        <SectionCard title="Conta">
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
        </SectionCard>
      </div>
    </>
  );
}
